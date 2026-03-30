#!/bin/sh

# Run migrations if we're in production
if [ "$NODE_ENV" = "production" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy --schema ./packages/prisma/schema.prisma
fi

# Execute the main command
exec "$@"
