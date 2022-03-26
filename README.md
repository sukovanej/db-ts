# db-ts

## Local development

Create the testing database

```bash
$ docker run -d -p 5432:5432 \
    -e POSTGRES_PASSWORD=test \
    -e POSTGRES_USER=test \
    -e POSTGRES_DB=test \
    --name db-ts-postgres postgres
```

Run all tests with

```bash
$ yarn test-all
```
