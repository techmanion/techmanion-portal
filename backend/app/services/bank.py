from datetime import date
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import BankAccount, BankTransaction, Currency, TransactionSource, TransactionType, User
from app.schemas import BankAccountCreate, BankAccountUpdate, BankTransactionCreate, BankTransferCreate
from app.services.activity import log_activity


def _actor_id(actor: User | None) -> int | None:
    return actor.id if actor else None


def create_bank_account(
    db: Session, payload: BankAccountCreate, actor: User | None = None
) -> BankAccount:
    account = BankAccount(**payload.model_dump())
    db.add(account)
    db.flush()
    log_activity(
        db,
        "BankAccount",
        account.id,
        "CREATE",
        f"Created bank account {account.name}",
        performed_by_user_id=_actor_id(actor),
    )
    db.commit()
    return account


def update_bank_account(
    db: Session, account: BankAccount, payload: BankAccountUpdate, actor: User | None = None
) -> BankAccount:
    if account.transactions and payload.currency != account.currency:
        raise HTTPException(
            status_code=422,
            detail="Bank account currency cannot be changed once transactions exist.",
        )
    was_active = account.is_active
    for key, value in payload.model_dump().items():
        setattr(account, key, value)

    if was_active and not account.is_active:
        action, verb = "DEACTIVATE", "Deactivated"
    elif not was_active and account.is_active:
        action, verb = "ACTIVATE", "Activated"
    else:
        action, verb = "UPDATE", "Updated"
    log_activity(
        db,
        "BankAccount",
        account.id,
        action,
        f"{verb} bank account {account.name}",
        performed_by_user_id=_actor_id(actor),
    )
    db.commit()
    return account


def bank_account_balance(account: BankAccount) -> int:
    credits_total = sum(
        row.amount for row in account.transactions if row.transaction_type == TransactionType.CREDIT
    )
    debits_total = sum(
        row.amount for row in account.transactions if row.transaction_type == TransactionType.DEBIT
    )
    return account.opening_balance + credits_total - debits_total


def bank_account_balance_pkr(account: BankAccount) -> int:
    opening_pkr = bank_account_opening_balance_pkr(account)
    credits_total = sum(
        row.pkr_equivalent for row in account.transactions if row.transaction_type == TransactionType.CREDIT
    )
    debits_total = sum(
        row.pkr_equivalent for row in account.transactions if row.transaction_type == TransactionType.DEBIT
    )
    return opening_pkr + credits_total - debits_total


def bank_account_opening_balance_pkr(account: BankAccount) -> int:
    """The account's opening balance (initial capital) expressed in PKR.

    Excluded from income/expense reconciliation: it's capital contributed to the
    business, not a tracked income or expense transaction.
    """
    return _resolve_pkr_equivalent(account, account.opening_balance, account.opening_balance_pkr)


def _require_active_bank_account(account: BankAccount) -> None:
    if not account.is_active:
        raise HTTPException(
            status_code=422,
            detail=f"{account.name} is inactive and cannot record transactions.",
        )


def _resolve_pkr_equivalent(account: BankAccount, amount: int, supplied: int | None) -> int:
    if account.currency == Currency.PKR:
        return amount
    if supplied is None:
        raise HTTPException(
            status_code=422, detail="PKR equivalent is required for non-PKR accounts."
        )
    return supplied


def _build_bank_transaction(
    db: Session,
    account: BankAccount,
    transaction_type: TransactionType,
    *,
    transaction_date: date,
    amount: int,
    pkr_equivalent_supplied: int | None,
    description: str,
    source: TransactionSource,
    notes: str | None = None,
) -> BankTransaction:
    """Create and flush a bank transaction without committing, so callers can
    persist it atomically alongside the domain row that owns it."""
    _require_active_bank_account(account)
    pkr_equivalent = _resolve_pkr_equivalent(account, amount, pkr_equivalent_supplied)
    transaction = BankTransaction(
        bank_account_id=account.id,
        transaction_type=transaction_type,
        transaction_date=transaction_date,
        amount=amount,
        pkr_equivalent=pkr_equivalent,
        description=description,
        notes=notes,
        source=source,
    )
    db.add(transaction)
    db.flush()
    return transaction


def add_bank_credit(
    db: Session, account: BankAccount, payload: BankTransactionCreate, actor: User | None = None
) -> BankTransaction:
    transaction = _build_bank_transaction(
        db,
        account,
        TransactionType.CREDIT,
        transaction_date=payload.date,
        amount=payload.amount,
        pkr_equivalent_supplied=payload.pkr_equivalent,
        description=payload.description,
        notes=payload.notes,
        source=TransactionSource.MANUAL,
    )
    log_activity(
        db,
        "BankTransaction",
        transaction.id,
        "CREATE",
        f"Recorded credit of {payload.amount} for {account.name}",
        performed_by_user_id=_actor_id(actor),
    )
    db.commit()
    return transaction


def add_bank_debit(
    db: Session, account: BankAccount, payload: BankTransactionCreate, actor: User | None = None
) -> BankTransaction:
    transaction = _build_bank_transaction(
        db,
        account,
        TransactionType.DEBIT,
        transaction_date=payload.date,
        amount=payload.amount,
        pkr_equivalent_supplied=payload.pkr_equivalent,
        description=payload.description,
        notes=payload.notes,
        source=TransactionSource.MANUAL,
    )
    log_activity(
        db,
        "BankTransaction",
        transaction.id,
        "CREATE",
        f"Recorded debit of {payload.amount} for {account.name}",
        performed_by_user_id=_actor_id(actor),
    )
    db.commit()
    return transaction


def create_bank_transfer(
    db: Session,
    source: BankAccount,
    destination: BankAccount,
    payload: BankTransferCreate,
    actor: User | None = None,
) -> tuple[BankTransaction, BankTransaction]:
    if source.id == destination.id:
        raise HTTPException(status_code=422, detail="Cannot transfer to the same account.")
    _require_active_bank_account(source)
    _require_active_bank_account(destination)

    if (
        source.currency == destination.currency
        and payload.source_amount != payload.destination_amount
    ):
        raise HTTPException(
            status_code=422,
            detail="Same-currency transfers must use the same amount for both accounts.",
        )

    if source.currency == Currency.PKR:
        pkr_equivalent = payload.source_amount
    elif destination.currency == Currency.PKR:
        pkr_equivalent = payload.destination_amount
    elif payload.pkr_equivalent is not None:
        pkr_equivalent = payload.pkr_equivalent
    else:
        raise HTTPException(
            status_code=422,
            detail="PKR equivalent is required when neither account is in PKR.",
        )

    transfer_id = uuid4().hex
    debit_leg = BankTransaction(
        bank_account_id=source.id,
        transaction_type=TransactionType.DEBIT,
        transaction_date=payload.date,
        amount=payload.source_amount,
        pkr_equivalent=pkr_equivalent,
        description=payload.description,
        notes=payload.notes,
        transfer_id=transfer_id,
        counterparty_account_id=destination.id,
        source=TransactionSource.TRANSFER,
    )
    credit_leg = BankTransaction(
        bank_account_id=destination.id,
        transaction_type=TransactionType.CREDIT,
        transaction_date=payload.date,
        amount=payload.destination_amount,
        pkr_equivalent=pkr_equivalent,
        description=payload.description,
        notes=payload.notes,
        transfer_id=transfer_id,
        counterparty_account_id=source.id,
        source=TransactionSource.TRANSFER,
    )
    db.add(debit_leg)
    db.add(credit_leg)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise
    log_activity(
        db,
        "BankTransfer",
        transfer_id,
        "CREATE",
        f"Transferred {payload.source_amount} from {source.name} to {destination.name}",
        performed_by_user_id=_actor_id(actor),
        metadata={
            "source_account_id": source.id,
            "destination_account_id": destination.id,
            "source_amount": payload.source_amount,
            "destination_amount": payload.destination_amount,
        },
    )
    db.commit()
    return debit_leg, credit_leg
