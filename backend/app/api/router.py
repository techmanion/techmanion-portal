from fastapi import APIRouter

from app.api.routes import (
    auth,
    employees,
    finance,
    hiring,
    home,
    organization,
    projects,
    public,
    settings,
)

router = APIRouter()

# Public endpoints: no authentication required (careers listing, company/contact info).
router.include_router(public.router)

# Everything else lives under /admin and requires an authenticated session; some
# endpoints additionally require ExecutiveUser (core member) access.
admin_router = APIRouter(prefix="/admin")
admin_router.include_router(auth.router)
admin_router.include_router(employees.router)
admin_router.include_router(hiring.router)
admin_router.include_router(projects.router)
admin_router.include_router(finance.router)
admin_router.include_router(home.router)
admin_router.include_router(settings.router)
admin_router.include_router(organization.router)
router.include_router(admin_router)
