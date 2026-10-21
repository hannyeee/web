from sqlalchemy import Engine, inspect


def migrate_board_ownership(engine: Engine) -> None:
    """Keep existing posts ownerless while adding ownership to older SQLite files."""
    if engine.dialect.name != "sqlite":
        return
    with engine.begin() as connection:
        inspector = inspect(connection)
        if not inspector.has_table("board"):
            return
        columns = {column["name"] for column in inspector.get_columns("board")}
        if "created_by" not in columns:
            connection.exec_driver_sql(
                'ALTER TABLE board ADD COLUMN created_by INTEGER REFERENCES "user" (idx)'
            )


def migrate_course_orders(engine: Engine) -> None:
    """Add payment columns to existing SQLite databases without changing orders."""
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as connection:
        inspector = inspect(connection)
        if not inspector.has_table("course_order"):
            return

        columns = {column["name"] for column in inspector.get_columns("course_order")}
        if "payment_id" not in columns:
            connection.exec_driver_sql("ALTER TABLE course_order ADD COLUMN payment_id VARCHAR(64)")
        if "paid_at" not in columns:
            connection.exec_driver_sql("ALTER TABLE course_order ADD COLUMN paid_at DATETIME")

        connection.exec_driver_sql(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_course_order_payment_id "
            "ON course_order (payment_id)"
        )
