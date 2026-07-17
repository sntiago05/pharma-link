-- Extra catalog data for local demos. Idempotent and additive.
INSERT INTO eps (name, nit, api_key_hash)
VALUES
  ('EPS Andina', '901000001-1', encode(digest('eps-andina-key', 'sha256'), 'hex')),
  ('EPS Caribe', '901000002-2', encode(digest('eps-caribe-key', 'sha256'), 'hex'))
ON CONFLICT (nit) DO NOTHING;

INSERT INTO medicines (code, name, presentation, description) VALUES
 ('MED-004','Amoxicilina 500 mg','Cápsulas x 21','Antibiótico'),
 ('MED-005','Atorvastatina 20 mg','Tabletas x 30','Hipolipemiante'),
 ('MED-006','Omeprazol 20 mg','Cápsulas x 30','Protección gástrica'),
 ('MED-007','Salbutamol','Inhalador','Broncodilatador'),
 ('MED-008','Loratadina 10 mg','Tabletas x 10','Antihistamínico'),
 ('MED-009','Diclofenaco 50 mg','Tabletas x 20','Antiinflamatorio'),
 ('MED-010','Amlodipino 5 mg','Tabletas x 30','Antihipertensivo')
ON CONFLICT (code) DO NOTHING;
