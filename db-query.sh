#!/bin/bash

# Simple utility script to query the Carcassonne PostgreSQL database

# Default query to show all games
DEFAULT_QUERY="SELECT * FROM games;"

# Use the provided query or the default one
QUERY=${1:-$DEFAULT_QUERY}

# Execute the query in the PostgreSQL container
docker exec carcassonne-postgres psql -U carcassonne -d carcassonne -c "$QUERY"