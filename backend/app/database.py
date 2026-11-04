"""SQLAlchemy database engine and session management."""

from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

db_url = settings.database_url
if db_url.startswith("postgresql://"):
    # Ensure psycopg2 driver is explicitly specified for SQLAlchemy
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

is_sqlite = db_url.startswith("sqlite")

engine_kwargs: dict = {"echo": False}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Cloud database connection pool configuration (Supabase PostgreSQL)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables defined by ORM models."""
    Base.metadata.create_all(bind=engine)
    if not is_sqlite:
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;"))
                conn.execute(text("ALTER TABLE public.model_evaluations ENABLE ROW LEVEL SECURITY;"))
                conn.execute(text("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Allow full access to postgres'
                        ) THEN
                            CREATE POLICY "Allow full access to postgres" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
                        END IF;
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_policies WHERE tablename = 'model_evaluations' AND policyname = 'Allow full access to postgres'
                        ) THEN
                            CREATE POLICY "Allow full access to postgres" ON public.model_evaluations FOR ALL USING (true) WITH CHECK (true);
                        END IF;
                    END $$;
                """))
                conn.commit()
        except Exception:
            pass  # Suppress errors if already configured or permissions vary

