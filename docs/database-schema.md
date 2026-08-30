# Salon Queue & Booking System — Database Schema (v1)

This schema is designed for **one salon** first, but every table already includes fields that make a future multi-tenant expansion straightforward (see notes at the bottom).

---

## 1. `admins`
The person(s) with full system control.

```sql
CREATE TABLE admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(100) NOT NULL,
    phone_number    VARCHAR(20) UNIQUE NOT NULL,
    email           VARCHAR(150) UNIQUE,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
```

---

## 2. `employees`
The staff who tend to customers.

```CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(100) NOT NULL,
    phone_number    VARCHAR(20) UNIQUE NOT NULL,
    email           VARCHAR(150) UNIQUE,
    id_number       VARCHAR(20) UNIQUE,
    role_title      VARCHAR(100),
    bio             TEXT,
    photo_url       TEXT,
    password_hash   TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'offline',
        -- 'available' | 'busy' | 'offline'
    is_active       BOOLEAN DEFAULT true,   -- soft-delete flag
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
```

*Note:* `status` is self-managed by the employee in real time (as we decided). Admin can override it, but the write comes through the same field.

---

## 3. `services`
Types of services offered (used for booking + duration estimates, not rigid pricing).

```sql
CREATE TABLE services (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,     -- e.g. "Gel Manicure"
    estimated_minutes   INT NOT NULL DEFAULT 30,   -- used for queue time estimates
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMP DEFAULT now()
);
```

---

## 4. `employee_services` (join table)
Which employees can perform which services — needed for future employee-skill matching.

```sql
CREATE TABLE employee_services (
    employee_id  UUID REFERENCES employees(id) ON DELETE CASCADE,
    service_id   UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, service_id)
);
```

---

## 5. `customers`
Registered via QR scan.

```sql
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(100) NOT NULL,
    phone_number    VARCHAR(20) UNIQUE NOT NULL,   -- also used for WhatsApp + M-Pesa
    loyalty_points  INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
```

---

## 6. `bookings` (the core queue/appointment table)
Handles **both** pre-booked appointments and walk-ins — the only difference is `requested_time`.

```sql
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID REFERENCES customers(id),
    employee_id         UUID REFERENCES employees(id),
    service_id          UUID REFERENCES services(id),

    type                VARCHAR(20) NOT NULL,
        -- 'booking' (pre-scheduled) | 'walkin'

    requested_time      TIMESTAMP NOT NULL,
        -- for bookings: the chosen slot
        -- for walk-ins: time they joined the queue

    estimated_time      TIMESTAMP,
        -- system-calculated estimate (esp. for walk-ins / delays)

    status              VARCHAR(30) NOT NULL DEFAULT 'pending',
        -- 'pending' | 'checked_in' | 'in_service'
        -- | 'completed' | 'released' | 'cancelled' | 'no_show'

    checked_in_at       TIMESTAMP,   -- when customer tapped "I'm here"
    service_started_at  TIMESTAMP,
    service_completed_at TIMESTAMP,

    grace_period_minutes INT DEFAULT 10,  -- snapshot of setting at booking time

    created_at          TIMESTAMP DEFAULT now(),
    updated_at          TIMESTAMP DEFAULT now()
);
```

**Why snapshot `grace_period_minutes` here instead of only reading from settings?**
If admin changes the grace period tomorrow, today's already-made bookings shouldn't retroactively change behavior. Snapshotting protects against that kind of bug.

---

## 7. `payments`
Populated only via M-Pesa/Daraja webhook confirmation — never manually created.

```sql
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id          UUID REFERENCES bookings(id),
    customer_id         UUID REFERENCES customers(id),
    amount              DECIMAL(10,2) NOT NULL,
    mpesa_receipt_number VARCHAR(50) UNIQUE,   -- from Daraja callback
    phone_number        VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
        -- 'pending' | 'confirmed' | 'failed'
    raw_callback_payload JSONB,   -- store full Daraja response for auditing
    created_at          TIMESTAMP DEFAULT now(),
    confirmed_at         TIMESTAMP
);
```

*Note:* `raw_callback_payload` (JSONB) is a habit worth building early — when a payment dispute happens, you want the exact original data from Safaricom, not just your interpretation of it.

---

## 8. `loyalty_transactions`
Tracks the *history* of point changes — don't just mutate `customers.loyalty_points` directly.

```sql
CREATE TABLE loyalty_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES customers(id),
    payment_id      UUID REFERENCES payments(id),  -- null if manual admin adjustment
    points_change   INT NOT NULL,        -- positive = earned, negative = redeemed
    reason          VARCHAR(100),        -- 'payment_earned' | 'redeemed' | 'admin_adjustment'
    created_at      TIMESTAMP DEFAULT now()
);
```

**Why a separate ledger table instead of just a running total?**
If a customer disputes their point balance, or you need to debug a bug, you can replay the full history. A single mutable number gives you no audit trail.

---

## 9. `settings`
Single-row config table (or key-value pairs) for admin-tunable values.

```sql
CREATE TABLE settings (
    key             VARCHAR(50) PRIMARY KEY,
    value           TEXT NOT NULL,
    updated_at      TIMESTAMP DEFAULT now()
);

-- example rows:
-- ('grace_period_minutes', '10')
-- ('points_per_100_ksh', '1')
-- ('points_redeem_threshold', '50')
```

---

## 10. `notifications_log`
Every WhatsApp message sent — useful for debugging and for not spamming customers twice.

```sql
CREATE TABLE notifications_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID REFERENCES customers(id),
    booking_id      UUID REFERENCES bookings(id),
    channel         VARCHAR(20) DEFAULT 'whatsapp',
    message_type    VARCHAR(50),   -- 'slot_released' | 'youre_next' | 'employee_free' | 'payment_prompt'
    status          VARCHAR(20),   -- 'sent' | 'delivered' | 'failed'
    sent_at         TIMESTAMP DEFAULT now()
);
```

---

## Entity Relationship Summary

```
admins (standalone — manages everything)

employees ──< employee_services >── services

customers ──< bookings >── employees
                  │
                  ├──< payments
                  │
                  └──< notifications_log

payments ──< loyalty_transactions >── customers

settings (standalone config)
```

---

## Notes for future multi-tenant expansion

When you're ready to support multiple salons, the main change is adding a `salon_id` foreign key to nearly every table (`employees`, `services`, `customers`, `bookings`, `settings`, etc.) and a new `salons` table. Because we already used UUIDs everywhere (not auto-increment integers) and kept each table's concerns cleanly separated, this migration will be additive — mostly new columns and one new table — rather than a rewrite. That's the payoff of designing it carefully now even though you're only building for one salon.
