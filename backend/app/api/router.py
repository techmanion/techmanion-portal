from fastapi import APIRouter

from app.api.routes import auth, employees, hiring, home, payroll, projects, settings

router = APIRouter()
router.include_router(auth.router)
router.include_router(employees.router)
router.include_router(hiring.router)
router.include_router(projects.router)
router.include_router(payroll.router)
router.include_router(home.router)
router.include_router(settings.router)
