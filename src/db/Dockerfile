FROM ankane/pgvector

COPY ./custom_postgres.conf /etc/postgresql/postgresql.conf

COPY ./init.sql /docker-entrypoint-initdb.d/

ENV POSTGRES_LOG_STATEMENT=all

EXPOSE 5432
