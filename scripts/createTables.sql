-- Create statuses enum types
CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');
CREATE TYPE order_status AS ENUM ('OPEN', 'APPROVED', 'CONFIRMED', 'SENT', 'COMPLETED', 'CANCELLED');

-- Create table carts
CREATE TABLE carts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at DATE NOT NULL,
    updated_at DATE NOT NULL,
    status cart_status NOT NULL
);

-- Create table cart_items
CREATE TABLE cart_items (
    cart_id UUID REFERENCES carts(id),
    product_id UUID NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (cart_id, product_id)
);

-- Create table orders
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    cart_id UUID NOT NULL,
    payment JSON NOT NULL,
    delivery JSON NOT NULL,
    comments TEXT,
    status TEXT NOT NULL,
    total NUMERIC NOT NULL
);

-- Create table users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    password TEXT NOT NULL
);


-- Create indexes
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);

