---
tags: [index]
---

# Techmanion Portal — Knowledge Base

This is the Obsidian knowledge base for the **Techmanion Portal**, an internal HR/operations
tool covering hiring, employees, projects, and payroll. It documents the codebase **as it is
implemented today**. Anything not yet built is explicitly marked **Planned**.

> [!info] Scope
> This vault describes the current repository state (FastAPI + PostgreSQL backend, React +
> Vite frontend). Legacy planning documents from the original spec phase still live alongside
> this vault at the repo's `docs/` root ([[software-house-management-system-spec]],
> [[design-doc]], [[planning-doc]], [[architecture]], [[data-model]], [[decisions]]) — see
> [[Phase 1]] for how the shipped product diverged from that original plan.

## Start here

| If you want to... | Read |
|---|---|
| Understand what the product does | [[Project Overview]] |
| See how the pieces fit together | [[System Architecture]] |
| Know the languages/frameworks used | [[Tech Stack]] |
| Find a file in the repo | [[Folder Structure]] |
| Set up a local dev environment | [[Getting Started]] |

## Database

- [[Database/Schema|Schema]] — full entity list and ERD
- [[Database/Employees|Employees]] · [[Database/Hiring|Hiring]] · [[Database/Projects|Projects]] · [[Database/Payroll|Payroll]] — per-domain tables and enums
- [[Database/Relationships|Relationships]] — foreign keys, cascades, integrity rules

## Backend (FastAPI)

- [[Backend/Architecture|Backend Architecture]] — process structure, request lifecycle
- [[Backend/API|API]] — full REST endpoint reference
- [[Backend/Models|Models]] — SQLAlchemy ORM models
- [[Backend/Services|Services]] — shared business logic (`app/services.py`)
- [[Backend/Authentication|Authentication]] — login, JWT, RBAC

## Frontend (React + Vite)

- [[Frontend/UI Architecture|UI Architecture]] — design tokens, theming, atomic design
- [[Frontend/Routing|Routing]] — route table, guards
- [[Frontend/Pages|Pages]] — every page component
- [[Frontend/Components|Components]] — atoms/molecules/organisms inventory
- [[Frontend/State Management|State Management]] — auth/theme context, data-fetching pattern

## Features (by module)

- [[Features/Home|Home]] · [[Features/Hiring|Hiring]] · [[Features/Employees|Employees]] ·
  [[Features/Projects|Projects]] · [[Features/Payroll|Payroll]] · [[Features/Settings|Settings]]

## Decisions & roadmap

- [[Phase 1]] — what actually shipped, and how it differs from the original plan
- [[Future Roadmap]] — Phase 2+ items, all **Planned**
- [[Known Limitations]] — gaps and rough edges in the current build

## Development

- [[Getting Started]] · [[Environment]] · [[Build & Run]] · [[Conventions]]
