-- Clear existing data and add comprehensive live data
-- Huggard & Ewing Automotive Registration Tracking System

-- Clear existing data (in correct order due to foreign key constraints)
DELETE FROM transactions;
DELETE FROM vehicles;
DELETE FROM customers;
DELETE FROM users;

-- Reset sequences (if using auto-increment)
-- Note: PostgreSQL uses different sequence reset syntax

-- Insert Users
INSERT INTO users (id, email, name, role, "createdAt", "updatedAt") VALUES
('user_001', 'admin@huggardewing.com', 'System Administrator', 'ADMIN', NOW(), NOW()),
('user_002', 'manager@huggardewing.com', 'Operations Manager', 'ADMIN', NOW(), NOW()),
('user_003', 'staff@huggardewing.com', 'Registration Staff', 'VIEWER', NOW(), NOW());

-- Insert Customers (Realistic customer data)
INSERT INTO customers (id, name, contact, "createdAt", "updatedAt") VALUES
('cust_001', 'John Smith', '555-0101', NOW(), NOW()),
('cust_002', 'Sarah Johnson', '555-0102', NOW(), NOW()),
('cust_003', 'Michael Brown', '555-0103', NOW(), NOW()),
('cust_004', 'Emily Davis', '555-0104', NOW(), NOW()),
('cust_005', 'Robert Wilson', '555-0105', NOW(), NOW()),
('cust_006', 'Lisa Anderson', '555-0106', NOW(), NOW()),
('cust_007', 'David Taylor', '555-0107', NOW(), NOW()),
('cust_008', 'Jennifer Martinez', '555-0108', NOW(), NOW()),
('cust_009', 'Christopher Lee', '555-0109', NOW(), NOW()),
('cust_010', 'Amanda Garcia', '555-0110', NOW(), NOW()),
('cust_011', 'James Rodriguez', '555-0111', NOW(), NOW()),
('cust_012', 'Michelle White', '555-0112', NOW(), NOW()),
('cust_013', 'Daniel Thompson', '555-0113', NOW(), NOW()),
('cust_014', 'Ashley Jackson', '555-0114', NOW(), NOW()),
('cust_015', 'Matthew Harris', '555-0115', NOW(), NOW()),
('cust_016', 'Jessica Clark', '555-0116', NOW(), NOW()),
('cust_017', 'Andrew Lewis', '555-0117', NOW(), NOW()),
('cust_018', 'Stephanie Walker', '555-0118', NOW(), NOW()),
('cust_019', 'Kevin Hall', '555-0119', NOW(), NOW()),
('cust_020', 'Nicole Allen', '555-0120', NOW(), NOW());

-- Insert Vehicles (Diverse vehicle data)
INSERT INTO vehicles (id, year, make, model, vin, "createdAt", "updatedAt") VALUES
('veh_001', '2020', 'Toyota', 'Camry', '1HGBH41JXMN109186', NOW(), NOW()),
('veh_002', '2019', 'Honda', 'Civic', '2HGBH41JXMN109187', NOW(), NOW()),
('veh_003', '2021', 'Ford', 'F-150', '3HGBH41JXMN109188', NOW(), NOW()),
('veh_004', '2018', 'Chevrolet', 'Silverado', '4HGBH41JXMN109189', NOW(), NOW()),
('veh_005', '2022', 'Nissan', 'Altima', '5HGBH41JXMN109190', NOW(), NOW()),
('veh_006', '2020', 'BMW', 'X5', '6HGBH41JXMN109191', NOW(), NOW()),
('veh_007', '2019', 'Mercedes-Benz', 'C-Class', '7HGBH41JXMN109192', NOW(), NOW()),
('veh_008', '2021', 'Audi', 'A4', '8HGBH41JXMN109193', NOW(), NOW()),
('veh_009', '2017', 'Lexus', 'RX', '9HGBH41JXMN109194', NOW(), NOW()),
('veh_010', '2020', 'Acura', 'MDX', '0HGBH41JXMN109195', NOW(), NOW()),
('veh_011', '2019', 'Infiniti', 'Q50', '1HGBH41JXMN109196', NOW(), NOW()),
('veh_012', '2021', 'Cadillac', 'Escalade', '2HGBH41JXMN109197', NOW(), NOW()),
('veh_013', '2018', 'Lincoln', 'Navigator', '3HGBH41JXMN109198', NOW(), NOW()),
('veh_014', '2022', 'Tesla', 'Model 3', '4HGBH41JXMN109199', NOW(), NOW()),
('veh_015', '2020', 'Subaru', 'Outback', '5HGBH41JXMN109200', NOW(), NOW()),
('veh_016', '2019', 'Mazda', 'CX-5', '6HGBH41JXMN109201', NOW(), NOW()),
('veh_017', '2021', 'Hyundai', 'Elantra', '7HGBH41JXMN109202', NOW(), NOW()),
('veh_018', '2018', 'Kia', 'Sorento', '8HGBH41JXMN109203', NOW(), NOW()),
('veh_019', '2020', 'Volkswagen', 'Jetta', '9HGBH41JXMN109204', NOW(), NOW()),
('veh_020', '2019', 'Volvo', 'XC90', '0HGBH41JXMN109205', NOW(), NOW()),
('veh_021', '2021', 'Jeep', 'Wrangler', '1HGBH41JXMN109206', NOW(), NOW()),
('veh_022', '2020', 'Ram', '1500', '2HGBH41JXMN109207', NOW(), NOW()),
('veh_023', '2019', 'GMC', 'Sierra', '3HGBH41JXMN109208', NOW(), NOW()),
('veh_024', '2022', 'Porsche', 'Cayenne', '4HGBH41JXMN109209', NOW(), NOW()),
('veh_025', '2018', 'Jaguar', 'F-PACE', '5HGBH41JXMN109210', NOW(), NOW());

-- Insert Transactions (Realistic transaction data with various statuses)
INSERT INTO transactions (id, "vehicleId", "customerId", date, payment, tax, status, plate, note, ref, "createdAt", "updatedAt") VALUES
-- Recent transactions (last 30 days)
('trans_001', 'veh_001', 'cust_001', '2024-01-15 09:30:00', 'PAID', 125.50, 'REGISTERED', 'ABC-123', 'Completed registration process', 'REF-2024-001', NOW(), NOW()),
('trans_002', 'veh_002', 'cust_002', '2024-01-16 10:15:00', 'UNPAID', 98.75, 'PICKED_UP', 'DEF-456', 'Customer picked up documents', 'REF-2024-002', NOW(), NOW()),
('trans_003', 'veh_003', 'cust_003', '2024-01-17 11:00:00', 'PAID', 150.00, 'INSPECTED', 'GHI-789', 'Vehicle inspection completed', 'REF-2024-003', NOW(), NOW()),
('trans_004', 'veh_004', 'cust_004', '2024-01-18 14:30:00', 'UNPAID', 87.25, 'TRANSFER_PLATE', 'JKL-012', 'Plate transfer in progress', 'REF-2024-004', NOW(), NOW()),
('trans_005', 'veh_005', 'cust_005', '2024-01-19 08:45:00', 'PAID', 200.00, 'TAUNTON_RMV', 'MNO-345', 'Processing at Taunton RMV', 'REF-2024-005', NOW(), NOW()),

-- Mid-term transactions (30-60 days ago)
('trans_006', 'veh_006', 'cust_006', '2023-12-20 13:20:00', 'PAID', 175.50, 'REGISTERED', 'PQR-678', 'Luxury vehicle registration', 'REF-2023-120', NOW(), NOW()),
('trans_007', 'veh_007', 'cust_007', '2023-12-22 15:45:00', 'UNPAID', 142.75, 'BROCKTON_RMV', 'STU-901', 'Processing at Brockton RMV', 'REF-2023-122', NOW(), NOW()),
('trans_008', 'veh_008', 'cust_008', '2023-12-25 10:30:00', 'PAID', 165.00, 'READY_FOR_PICKUP', 'VWX-234', 'Ready for customer pickup', 'REF-2023-125', NOW(), NOW()),
('trans_009', 'veh_009', 'cust_009', '2023-12-28 12:15:00', 'UNPAID', 95.50, 'RE_INSPECTION', 'YZA-567', 'Requires re-inspection', 'REF-2023-128', NOW(), NOW()),
('trans_010', 'veh_010', 'cust_010', '2023-12-30 16:00:00', 'PAID', 110.25, 'INSPECTED', 'BCD-890', 'Inspection passed', 'REF-2023-130', NOW(), NOW()),

-- Older transactions (60+ days ago)
('trans_011', 'veh_011', 'cust_011', '2023-11-15 09:00:00', 'PAID', 130.00, 'REGISTERED', 'EFG-123', 'Completed registration', 'REF-2023-110', NOW(), NOW()),
('trans_012', 'veh_012', 'cust_012', '2023-11-18 11:30:00', 'PAID', 185.75, 'REGISTERED', 'HIJ-456', 'Luxury SUV registration', 'REF-2023-113', NOW(), NOW()),
('trans_013', 'veh_013', 'cust_013', '2023-11-22 14:45:00', 'UNPAID', 155.50, 'PICKED_UP', 'KLM-789', 'Customer picked up', 'REF-2023-117', NOW(), NOW()),
('trans_014', 'veh_014', 'cust_014', '2023-11-25 08:15:00', 'PAID', 220.00, 'REGISTERED', 'NOP-012', 'Electric vehicle registration', 'REF-2023-120', NOW(), NOW()),
('trans_015', 'veh_015', 'cust_015', '2023-11-28 13:30:00', 'UNPAID', 105.25, 'INSPECTED', 'QRS-345', 'Inspection completed', 'REF-2023-123', NOW(), NOW()),

-- Various status scenarios
('trans_016', 'veh_016', 'cust_016', '2024-01-10 10:00:00', 'PAID', 140.00, 'TRANSFER_PLATE', 'TUV-678', 'Plate transfer initiated', 'REF-2024-010', NOW(), NOW()),
('trans_017', 'veh_017', 'cust_017', '2024-01-12 15:30:00', 'UNPAID', 115.75, 'TAUNTON_RMV', 'WXY-901', 'At Taunton RMV', 'REF-2024-012', NOW(), NOW()),
('trans_018', 'veh_018', 'cust_018', '2024-01-14 12:45:00', 'PAID', 160.50, 'BROCKTON_RMV', 'ZAB-234', 'At Brockton RMV', 'REF-2024-014', NOW(), NOW()),
('trans_019', 'veh_019', 'cust_019', '2024-01-16 09:15:00', 'UNPAID', 90.00, 'RE_INSPECTION', 'CDE-567', 'Failed inspection, needs re-inspection', 'REF-2024-016', NOW(), NOW()),
('trans_020', 'veh_020', 'cust_020', '2024-01-18 16:20:00', 'PAID', 195.25, 'READY_FOR_PICKUP', 'FGH-890', 'All documents ready', 'REF-2024-018', NOW(), NOW()),

-- No status transactions (for testing "No Status" filter)
('trans_021', 'veh_021', 'cust_001', '2024-01-20 10:30:00', 'UNPAID', 75.50, NULL, NULL, 'New transaction, no status yet', 'REF-2024-020', NOW(), NOW()),
('trans_022', 'veh_022', 'cust_002', '2024-01-21 14:15:00', 'PAID', 120.00, NULL, NULL, 'Payment received, status pending', 'REF-2024-021', NOW(), NOW()),
('trans_023', 'veh_023', 'cust_003', '2024-01-22 11:45:00', 'UNPAID', 85.75, NULL, NULL, 'Awaiting initial processing', 'REF-2024-022', NOW(), NOW()),

-- High-value transactions
('trans_024', 'veh_024', 'cust_004', '2024-01-23 13:00:00', 'PAID', 350.00, 'INSPECTED', 'IJK-123', 'Luxury vehicle inspection', 'REF-2024-023', NOW(), NOW()),
('trans_025', 'veh_025', 'cust_005', '2024-01-24 15:30:00', 'UNPAID', 280.50, 'TRANSFER_PLATE', 'LMN-456', 'High-value plate transfer', 'REF-2024-024', NOW(), NOW());

-- Display summary
SELECT 
    'Data Insertion Complete' as status,
    (SELECT COUNT(*) FROM users) as user_count,
    (SELECT COUNT(*) FROM customers) as customer_count,
    (SELECT COUNT(*) FROM vehicles) as vehicle_count,
    (SELECT COUNT(*) FROM transactions) as transaction_count;
