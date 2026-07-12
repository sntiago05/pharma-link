CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_user_role
        FOREIGN KEY(role_id)
        REFERENCES roles(id)
);

CREATE TABLE eps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    nit VARCHAR(30) UNIQUE NOT NULL,

    api_key VARCHAR(255) NOT NULL UNIQUE,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (

    id SERIAL PRIMARY KEY,

    user_id INTEGER UNIQUE NOT NULL,

    eps_id INTEGER NOT NULL,

    document VARCHAR(30) UNIQUE NOT NULL,

    phone VARCHAR(20),

    CONSTRAINT fk_patient_user
        FOREIGN KEY(user_id)
        REFERENCES users(id),

    CONSTRAINT fk_patient_eps
        FOREIGN KEY(eps_id)
        REFERENCES eps(id)
);

CREATE TABLE pharmacies (

    id SERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    nit VARCHAR(30) UNIQUE,

    address VARCHAR(200),

    city VARCHAR(80),

    inventory_api_url TEXT NOT NULL,

    api_key VARCHAR(255),

    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE eps_pharmacies (

    id SERIAL PRIMARY KEY,

    eps_id INTEGER NOT NULL,

    pharmacy_id INTEGER NOT NULL,

    active BOOLEAN DEFAULT TRUE,

    UNIQUE(eps_id, pharmacy_id),

    FOREIGN KEY(eps_id)
        REFERENCES eps(id),

    FOREIGN KEY(pharmacy_id)
        REFERENCES pharmacies(id)
);

CREATE TABLE medicines (

    id SERIAL PRIMARY KEY,

    code VARCHAR(40) UNIQUE NOT NULL,

    name VARCHAR(150) NOT NULL,

    presentation VARCHAR(100),

    description TEXT
);

CREATE TABLE medical_orders (

    id SERIAL PRIMARY KEY,

    patient_id INTEGER NOT NULL,

    eps_id INTEGER NOT NULL,

    order_number VARCHAR(100) UNIQUE NOT NULL,

    issue_date DATE NOT NULL,

    expiration_date DATE NOT NULL,

    status VARCHAR(30) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(patient_id)
        REFERENCES patients(id),

    FOREIGN KEY(eps_id)
        REFERENCES eps(id)
);

CREATE TABLE order_details (

    id SERIAL PRIMARY KEY,

    order_id INTEGER NOT NULL,

    medicine_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL CHECK(quantity>0),

    FOREIGN KEY(order_id)
        REFERENCES medical_orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY(medicine_id)
        REFERENCES medicines(id)
);

CREATE TABLE working_hours (

    id SERIAL PRIMARY KEY,

    pharmacy_id INTEGER UNIQUE NOT NULL,

    opening_time TIME NOT NULL,

    closing_time TIME NOT NULL,

    slot_duration INTEGER NOT NULL,

    capacity_per_slot INTEGER NOT NULL,

    FOREIGN KEY(pharmacy_id)
        REFERENCES pharmacies(id)
);

CREATE TABLE reservations (

    id SERIAL PRIMARY KEY,

    order_id INTEGER NOT NULL,

    pharmacy_id INTEGER NOT NULL,

    reservation_date DATE NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    status VARCHAR(30) DEFAULT 'RESERVED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(order_id)
        REFERENCES medical_orders(id),

    FOREIGN KEY(pharmacy_id)
        REFERENCES pharmacies(id)
);

CREATE TABLE deliveries (

    id SERIAL PRIMARY KEY,

    reservation_id INTEGER UNIQUE NOT NULL,

    delivered_at TIMESTAMP,

    delivered_by VARCHAR(150),

    FOREIGN KEY(reservation_id)
        REFERENCES reservations(id)
);