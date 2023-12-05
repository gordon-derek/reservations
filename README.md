# Reservations

## Description

### Scenario

There are two kinds of users, providers and clients. Providers have a schedule where they are available to see clients. Clients want to book an appointment time, in advance from that schedule.

### Task

Build an API with the following endpoints:

- Allows providers to submit times they are available for appointments
  - e.g. On Friday the 13th of August, Dr. Jekyll wants to work between 8am and 3pm
- Allows a client to retrieve a list of available appointment slots
  - Appointment slots are 15 minutes long
- Allows clients to reserve an available appointment slot
- Allows clients to confirm their reservation

Additional Requirements:

- Reservations expire after 30 minutes if not confirmed and are again available for other clients to reserve that appointment slot
- Reservations must be made at least 24 hours in advance

## Dependencies

Install Node Version 20.10.0 LTS <https://nodejs.org/en/download>

## Installation

```bash
$ yarn
```

## Running the app

```bash
# development
$ yarn start
```

- While Running Locally
  - To View API Reference go to `localhost:3000/docs`
  - To import Postman Collection click the import button and paste: `http://localhost:3000/docs-yaml`

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## TradeOffs

In the interest of time I went with a very basic data implementation that would not scale when building out. It was implemented using separation so that when the time to upgrade came it wouldn't be a particularly heavy lift.

Structuring around the Appointments should be split up. There should be Provider and Client Modules so that we can better define rules around what they can and can't do as well as set up authorization so that providers can only adjust their own availability and clients can only schedule appointments for themselves.
