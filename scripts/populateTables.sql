-- Populate carts table with test data
INSERT INTO carts (id, user_id, created_at, updated_at, status) VALUES
    ('a1b2c3d4-e5f6-47a8-9b0c-d1e2f3a4b5c6', 'f9e8d7c6-b5a4-3210-9876-f5e4d3c2b1a0', CURRENT_DATE - 10, CURRENT_DATE - 5, 'OPEN'),
    ('b2c3d4e5-f6a7-48b8-9c0d-e2f3a4b5c6d7', 'e8d7c6b5-a432-1098-7654-e3d2c1b0a9f8', CURRENT_DATE - 8, CURRENT_DATE - 8, 'ORDERED'),
    ('c3d4e5f6-a7b8-49c9-8d0e-f3a4b5c6d7e8', 'd7c6b5a4-3210-9876-5432-d2c1b0a9f8e7', CURRENT_DATE - 7, CURRENT_DATE - 2, 'OPEN'),
    ('d4e5f6a7-b8c9-40d0-9e1f-a4b5c6d7e8f9', 'c6b5a432-1098-7654-3210-c1b0a9f8e7d6', CURRENT_DATE - 5, CURRENT_DATE - 1, 'ORDERED'),
    ('e5f6a7b8-c9d0-41e1-8f2a-b5c6d7e8f9a0', 'b5a43210-9876-5432-1098-b0a9f8e7d6c5', CURRENT_DATE - 3, CURRENT_DATE, 'OPEN');

-- Populate cart_items table with test data
INSERT INTO cart_items (cart_id, product_id, count) VALUES
    -- cart 1
    ('a1b2c3d4-e5f6-47a8-9b0c-d1e2f3a4b5c6', '27bcaefb-b4ad-471f-b98c-b90d5767a635', 2),
    ('a1b2c3d4-e5f6-47a8-9b0c-d1e2f3a4b5c6', 'e3f7a8d1-5b6c-4092-9e8a-2f1d3b7c6e5a', 1),
    ('a1b2c3d4-e5f6-47a8-9b0c-d1e2f3a4b5c6', '6c74643c-ea12-4d0f-9918-4785468aa68a', 3),
    ('a1b2c3d4-e5f6-47a8-9b0c-d1e2f3a4b5c6', 'cec67273-f62c-42ee-9a9f-88008bd72860', 1),
    
    -- cart 2
    ('b2c3d4e5-f6a7-48b8-9c0d-e2f3a4b5c6d7', '9d8c7b6a-5f4e-3d2c-1b0a-9d8c7b6a5f4e', 5),
    ('b2c3d4e5-f6a7-48b8-9c0d-e2f3a4b5c6d7', '5e4366a2-b79f-43d8-8470-bf2a36edc175', 1),
    ('b2c3d4e5-f6a7-48b8-9c0d-e2f3a4b5c6d7', '0da3e665-9c17-4e22-8a16-ed2d732bb925', 2),
    
    -- cart 3
    ('c3d4e5f6-a7b8-49c9-8d0e-f3a4b5c6d7e8', '6181d4f8-41cd-47f3-af8c-a1e4cdc461d7', 1),
    ('c3d4e5f6-a7b8-49c9-8d0e-f3a4b5c6d7e8', 'a2745d89-07b2-45f9-bfe4-53f1f7bd351c', 2),
    ('c3d4e5f6-a7b8-49c9-8d0e-f3a4b5c6d7e8', 'f20c816e-d222-4445-8a54-67e95454c8a3', 3),
    ('c3d4e5f6-a7b8-49c9-8d0e-f3a4b5c6d7e8', '2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d', 2),
    ('c3d4e5f6-a7b8-49c9-8d0e-f3a4b5c6d7e8', '72f9ec1c-349f-484a-829b-de0a0c5c5362', 1),
    
    -- cart 4
    ('d4e5f6a7-b8c9-40d0-9e1f-a4b5c6d7e8f9', '58165598-f9b2-4fe2-8f0f-fcd850dc6418', 4),
    ('d4e5f6a7-b8c9-40d0-9e1f-a4b5c6d7e8f9', 'd3cc4704-2b01-4763-9d44-c9f595505e58', 2),
    ('d4e5f6a7-b8c9-40d0-9e1f-a4b5c6d7e8f9', '71b2e9c4-8a3d-47f6-b5e1-9c0d8a7b6e5f', 1),
    
    -- cart 5
    ('e5f6a7b8-c9d0-41e1-8f2a-b5c6d7e8f9a0', 'a2745d89-07b2-45f9-bfe4-53f1f7bd351c', 3),
    ('e5f6a7b8-c9d0-41e1-8f2a-b5c6d7e8f9a0', '2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d', 2),
    ('e5f6a7b8-c9d0-41e1-8f2a-b5c6d7e8f9a0', '27bcaefb-b4ad-471f-b98c-b90d5767a635', 1);
