-- Core Subjects, Chapters & Topics Taxonomy
-- Lightweight (~8KB): Executes in under 1 second in Supabase SQL Editor.

INSERT INTO public.subjects (id, name, code)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Physics', 'PHY'),
  ('11111111-0000-0000-0000-000000000002', 'Chemistry', 'CHEM'),
  ('11111111-0000-0000-0000-000000000003', 'Mathematics', 'MATH'),
  ('11111111-0000-0000-0000-000000000004', 'Biology', 'BIO')
ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code;

INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('754cf45c-0d59-4879-a1a0-a73723ee7903', '11111111-0000-0000-0000-000000000001', 'Kinematics & Vectors', 1)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('f355858d-ea5e-4162-a614-d15ee63c7591', '754cf45c-0d59-4879-a1a0-a73723ee7903', '1D Motion', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('a33e3542-a05d-4852-a818-f9068f7ea03c', '754cf45c-0d59-4879-a1a0-a73723ee7903', 'Projectile Motion', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('643a3289-be5d-45af-aac0-6f56a0b0907c', '754cf45c-0d59-4879-a1a0-a73723ee7903', 'Relative Motion', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('0c8421b8-faca-4e8e-ac83-f8e12e21e69a', '754cf45c-0d59-4879-a1a0-a73723ee7903', 'Vector Algebra', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('48c3ac8e-8b28-4bb4-aea9-4218e9ed17e0', '11111111-0000-0000-0000-000000000001', 'Laws of Motion & Friction', 2)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('b9b2be90-9e24-452d-a8d8-698944de76ab', '48c3ac8e-8b28-4bb4-aea9-4218e9ed17e0', 'Newtons Laws', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('fe68e1f3-6c2f-46b5-a3a3-1a8a4b0b63e2', '48c3ac8e-8b28-4bb4-aea9-4218e9ed17e0', 'Friction & Banking', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('85efd74f-3e03-4d59-abde-ab9be5b97595', '48c3ac8e-8b28-4bb4-aea9-4218e9ed17e0', 'Pulleys & Constraints', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('d4a62904-e1d5-446c-a0c9-d86048b9d12f', '48c3ac8e-8b28-4bb4-aea9-4218e9ed17e0', 'Pseudo Force', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('b951e43f-a56c-465a-a1fb-9df64b508f13', '11111111-0000-0000-0000-000000000001', 'Work, Power & Energy', 3)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('4e9b63e1-dfeb-4850-a612-c893fc0f03d9', 'b951e43f-a56c-465a-a1fb-9df64b508f13', 'Work-Energy Theorem', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('e4f32655-8998-4658-ab3b-723c0c928168', 'b951e43f-a56c-465a-a1fb-9df64b508f13', 'Conservation of Energy', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('2ddf3a2b-b9fd-4628-a7e5-e3e2b8931724', 'b951e43f-a56c-465a-a1fb-9df64b508f13', 'Power & Efficiency', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('0e26d21d-3915-42d8-abeb-b80530f41ec2', 'b951e43f-a56c-465a-a1fb-9df64b508f13', 'Potential Energy Curves', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('7b42fedf-686b-4955-ae8d-e783fe8ba10b', '11111111-0000-0000-0000-000000000001', 'Rotational Dynamics', 4)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('a8c02169-d437-4545-a2c8-228304cb1791', '7b42fedf-686b-4955-ae8d-e783fe8ba10b', 'Moment of Inertia', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('cf992b60-8aad-46c8-ac9c-8e5ef96f87f1', '7b42fedf-686b-4955-ae8d-e783fe8ba10b', 'Torque & Equilibrium', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('7f0126e9-8102-447b-a89b-16c59ac30080', '7b42fedf-686b-4955-ae8d-e783fe8ba10b', 'Angular Momentum', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('9292d797-43ee-4410-a6bf-b4ffbfe308f8', '7b42fedf-686b-4955-ae8d-e783fe8ba10b', 'Rolling Dynamics', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('e5acc964-50ea-44b1-a772-a1b320676cb3', '11111111-0000-0000-0000-000000000001', 'Gravitation', 5)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('39c66005-7f87-498d-ae3c-d3a6cc2d4557', 'e5acc964-50ea-44b1-a772-a1b320676cb3', 'Universal Gravitation', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('5a2106e8-5bd4-4840-a894-875bb5c317dd', 'e5acc964-50ea-44b1-a772-a1b320676cb3', 'Gravitational Potential', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('96b6fb80-5d40-406b-ade7-4db7740eb72b', 'e5acc964-50ea-44b1-a772-a1b320676cb3', 'Keplers Laws', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('5fd3339e-b869-4b1d-a5a9-789bc739f118', 'e5acc964-50ea-44b1-a772-a1b320676cb3', 'Escape & Orbital Velocity', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('f1b0cb80-58fe-408b-a95c-b026d2685b5c', '11111111-0000-0000-0000-000000000001', 'Thermodynamics & Heat', 6)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('7d938193-3083-40f0-aacb-6a8e76cdd664', 'f1b0cb80-58fe-408b-a95c-b026d2685b5c', 'First Law of Thermo', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('8669d87d-d6d4-440c-aee2-33251e2865b8', 'f1b0cb80-58fe-408b-a95c-b026d2685b5c', 'Carnot Engine & Cycles', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('692493a0-0ae2-4329-a776-9a93b9318882', 'f1b0cb80-58fe-408b-a95c-b026d2685b5c', 'Calorimetry', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('3ea92302-25df-498b-ae3c-a2622dbab606', 'f1b0cb80-58fe-408b-a95c-b026d2685b5c', 'Radiation & Conduction', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('7e8026da-d616-467d-a8d1-2344f2d8e460', '11111111-0000-0000-0000-000000000001', 'Electrostatics & Capacitance', 7)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('48caa92c-c2f2-4427-a5d9-ae11ad2ca2d8', '7e8026da-d616-467d-a8d1-2344f2d8e460', 'Coulombs Law & Field', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('827d0d2e-384e-4dde-a6be-f76113c29e11', '7e8026da-d616-467d-a8d1-2344f2d8e460', 'Gauss Law Applications', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('83468ec3-e85b-45be-aa4d-ec7a4ad955fe', '7e8026da-d616-467d-a8d1-2344f2d8e460', 'Electric Potential', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('f14fba50-a897-4801-aefb-ab63bab22bde', '7e8026da-d616-467d-a8d1-2344f2d8e460', 'Capacitor Networks', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('a2e5bf5d-ad90-4474-a1a7-ec9927fd53a7', '11111111-0000-0000-0000-000000000001', 'Current Electricity & Magnetism', 8)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('922ec15e-7bde-4e9b-afcd-ca9834880813', 'a2e5bf5d-ad90-4474-a1a7-ec9927fd53a7', 'Ohms Law & Kirchoff', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('4a85602c-5b11-4997-ac2b-3ccfba8c3b98', 'a2e5bf5d-ad90-4474-a1a7-ec9927fd53a7', 'Biot-Savart Law', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('921bde03-968d-4704-ada2-3d5a51acba2e', 'a2e5bf5d-ad90-4474-a1a7-ec9927fd53a7', 'Amperes Law', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('89fb3ecd-c36f-4310-aa8c-9626484ff9aa', 'a2e5bf5d-ad90-4474-a1a7-ec9927fd53a7', 'Lorentz Force & Cyclotron', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('cd7db698-ab4b-4009-af70-ca45115a75ac', '11111111-0000-0000-0000-000000000001', 'Electromagnetic Induction & AC', 9)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('3137e447-6bed-4894-a07c-dd113fd7bb67', 'cd7db698-ab4b-4009-af70-ca45115a75ac', 'Faradays Law & Lenz', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('ff329b7f-e0a9-44a8-a37b-5ad4a94c8ae4', 'cd7db698-ab4b-4009-af70-ca45115a75ac', 'Self & Mutual Inductance', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('0bfeb099-3b9b-4047-ac51-c6a5282c7c87', 'cd7db698-ab4b-4009-af70-ca45115a75ac', 'LCR Resonance', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('d1ad2b71-d4f0-40c7-a2dc-6b57356418be', 'cd7db698-ab4b-4009-af70-ca45115a75ac', 'AC Transformers', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('a3c1c029-1406-40c8-aae0-3f7491a10b88', '11111111-0000-0000-0000-000000000001', 'Ray & Wave Optics', 10)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('8d4382a7-be45-4129-a908-1b8d20f84b35', 'a3c1c029-1406-40c8-aae0-3f7491a10b88', 'Refraction at Spherical Surfaces', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('40e7edce-0585-458d-a611-9ddf81bc515a', 'a3c1c029-1406-40c8-aae0-3f7491a10b88', 'Lenses & Mirrors', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('447c9822-e33c-41fe-a975-01d777b93a21', 'a3c1c029-1406-40c8-aae0-3f7491a10b88', 'Interference & YDSE', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('2237278d-6f9d-4820-a293-3c559ed82d7e', 'a3c1c029-1406-40c8-aae0-3f7491a10b88', 'Diffraction & Polarization', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('4574f758-fbac-4247-ae32-ce93cda22a2f', '11111111-0000-0000-0000-000000000001', 'Modern Physics & Nuclear', 11)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('f2b994ff-cf2c-4d68-aa68-4af73636a102', '4574f758-fbac-4247-ae32-ce93cda22a2f', 'Photoelectric Effect', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('cbb5c581-4e60-4499-a0ad-0fbeb3b8cafa', '4574f758-fbac-4247-ae32-ce93cda22a2f', 'Bohrs Atomic Model', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('ee937c92-1ead-4852-afa3-5f685d992d2f', '4574f758-fbac-4247-ae32-ce93cda22a2f', 'Radioactive Decay', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('c7d040d9-530a-489b-a683-2889d9ed263c', '4574f758-fbac-4247-ae32-ce93cda22a2f', 'De Broglie Wavelength', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('3072432f-90b2-4258-acb5-2c98128965dd', '11111111-0000-0000-0000-000000000002', 'Physical Chemistry: Mole & Solutions', 1)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('6311519d-33d1-4754-a896-6402b8c5db6e', '3072432f-90b2-4258-acb5-2c98128965dd', 'Stoichiometry', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('ae1e3ee7-d464-484b-a3b1-a801196196c1', '3072432f-90b2-4258-acb5-2c98128965dd', 'Concentration Terms', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('f8efc205-c8e2-4a22-a4e4-7a2766a5c9a1', '3072432f-90b2-4258-acb5-2c98128965dd', 'Colligative Properties', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('bab7b24d-4dbb-4079-adbe-21004e8eb047', '3072432f-90b2-4258-acb5-2c98128965dd', 'Raoults Law', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('f58c3069-1949-435f-a4c7-f4881e8e685c', '11111111-0000-0000-0000-000000000002', 'Atomic Structure & Chemical Bonding', 2)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('a90b7315-f56a-4014-af42-255992b8a9b0', 'f58c3069-1949-435f-a4c7-f4881e8e685c', 'Quantum Numbers & Orbitals', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('3fb16254-b03b-47c5-a71a-e22864a7e062', 'f58c3069-1949-435f-a4c7-f4881e8e685c', 'VSEPR Theory', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('201fa87f-a56b-4854-ab92-7234daf3b01d', 'f58c3069-1949-435f-a4c7-f4881e8e685c', 'Hybridization', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('2af9c2d5-7eec-43f2-af39-51b205e769f2', 'f58c3069-1949-435f-a4c7-f4881e8e685c', 'Molecular Orbital Theory', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('3cdd7cb2-6b55-4e84-a6f8-8cffdd35c398', '11111111-0000-0000-0000-000000000002', 'Chemical Equilibrium & Kinetics', 3)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('c02cd4b4-18ca-4d45-ab36-d8d48789162e', '3cdd7cb2-6b55-4e84-a6f8-8cffdd35c398', 'Equilibrium Constant Kp & Kc', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('1cf5cb28-ceda-4a70-ad10-805f2f9c8626', '3cdd7cb2-6b55-4e84-a6f8-8cffdd35c398', 'Le Chateliers Principle', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('9962c618-a155-454a-ac72-470415dc97b6', '3cdd7cb2-6b55-4e84-a6f8-8cffdd35c398', 'Order of Reaction', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('32802fd8-9486-488e-a8e8-a61b2ad8ff69', '3cdd7cb2-6b55-4e84-a6f8-8cffdd35c398', 'Arrhenius Equation', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('0dc78c86-8509-4b35-a871-3e28d1a14c53', '11111111-0000-0000-0000-000000000002', 'Electrochemistry & Redox', 4)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('c9c34d30-c449-42cc-ab4e-f40508a352fe', '0dc78c86-8509-4b35-a871-3e28d1a14c53', 'Nernst Equation', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('6cffa2fe-81a6-46b1-a7cb-d9e331f3231a', '0dc78c86-8509-4b35-a871-3e28d1a14c53', 'Faradays Laws of Electrolysis', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('6b929378-bc63-4e53-acdd-ac0d15b5fe7f', '0dc78c86-8509-4b35-a871-3e28d1a14c53', 'Galvanic Cells', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('c37cc719-2786-4b97-a5e7-50bc7e46c033', '0dc78c86-8509-4b35-a871-3e28d1a14c53', 'Conductance & Kohlrausch', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('d5fe344d-7e6d-447f-ab17-400a22e5caa8', '11111111-0000-0000-0000-000000000002', 'Inorganic: Periodic Table & Coordination', 5)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('7fa320a9-dcb7-46e1-ac9d-107f0f7f8c8b', 'd5fe344d-7e6d-447f-ab17-400a22e5caa8', 'Periodic Trends', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('26ea354b-6221-4d66-ab0d-7dee203802a7', 'd5fe344d-7e6d-447f-ab17-400a22e5caa8', 'Crystal Field Theory', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('95d68c34-36b9-4373-aaf6-adf4da38ef7e', 'd5fe344d-7e6d-447f-ab17-400a22e5caa8', 'IUPAC Naming & Isomerism', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('c2c4db6f-8b43-4188-ada1-c2abf14a62a9', 'd5fe344d-7e6d-447f-ab17-400a22e5caa8', 'CFT Magnetic Moments', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('3c2a97d5-c331-4224-a58c-0f1055ce67fa', '11111111-0000-0000-0000-000000000002', 'Inorganic: p-Block & d-Block Elements', 6)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('6d735014-92a4-4468-a8b4-9b7bd8ba58bf', '3c2a97d5-c331-4224-a58c-0f1055ce67fa', 'Group 15-18 Trends', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('71c506d3-a258-414f-a525-e76a3f92c11a', '3c2a97d5-c331-4224-a58c-0f1055ce67fa', 'Transition Metal Complexes', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('340933bc-435d-4a18-af19-2409cb18da91', '3c2a97d5-c331-4224-a58c-0f1055ce67fa', 'Lanthanoid Contraction', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('35279314-3aac-4322-adda-3ea4f381dd4d', '3c2a97d5-c331-4224-a58c-0f1055ce67fa', 'Qualitative Analysis', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('87163565-8094-4264-a0cb-a551ad1f07dc', '11111111-0000-0000-0000-000000000002', 'Organic: General Organic Chemistry (GOC)', 7)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('ed9cb0c6-efb0-4688-afd4-de092e58380d', '87163565-8094-4264-a0cb-a551ad1f07dc', 'Inductive & Resonance Effects', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('219cd478-f85a-4aa1-aab9-95888e1cd110', '87163565-8094-4264-a0cb-a551ad1f07dc', 'Hyperconjugation & Aromaticity', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('1371bbd6-e9a1-43a8-aada-4015e22a2647', '87163565-8094-4264-a0cb-a551ad1f07dc', 'Acidity & Basicity', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('1ec14aff-835a-4247-ae5d-dd2bf111826d', '87163565-8094-4264-a0cb-a551ad1f07dc', 'Reaction Intermediates', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('31285b31-2e82-445d-a5a9-9d237f37fcb4', '11111111-0000-0000-0000-000000000002', 'Organic: Hydrocarbons & Haloalkanes', 8)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('786ffe66-cf5d-463c-adc4-16f3a0a35f22', '31285b31-2e82-445d-a5a9-9d237f37fcb4', 'Electrophilic Aromatic Substitution', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('2627102f-3872-4395-a237-b128e73f94d9', '31285b31-2e82-445d-a5a9-9d237f37fcb4', 'SN1 and SN2 Mechanisms', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('5e84dcbd-9905-4b95-aafd-c2b88a065ac7', '31285b31-2e82-445d-a5a9-9d237f37fcb4', 'Elimination Reactions', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('5ed16c6c-6824-4aad-a039-cd3dedc54234', '31285b31-2e82-445d-a5a9-9d237f37fcb4', 'Markovnikov Addition', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('8f832dd8-818c-4b7b-a18f-b3c9b24b4f02', '11111111-0000-0000-0000-000000000002', 'Organic: Carbonyl Compounds & Amines', 9)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('aab5c4aa-06d0-466c-af33-0d3ad1726104', '8f832dd8-818c-4b7b-a18f-b3c9b24b4f02', 'Aldol & Cannizzaro', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('9d7b07c4-d899-4522-ad20-4ffdc95d699b', '8f832dd8-818c-4b7b-a18f-b3c9b24b4f02', 'Grignard Reagents', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('2690a38e-1d37-4c54-a2c9-0c81a83bf984', '8f832dd8-818c-4b7b-a18f-b3c9b24b4f02', 'Diazonium Salts', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('aa2d6c44-53c5-4f0e-a6df-ea58203fb8a7', '8f832dd8-818c-4b7b-a18f-b3c9b24b4f02', 'Hoffmann Bromamide', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('5cb2e242-0075-4fd2-a2a2-46b4cedf34e1', '11111111-0000-0000-0000-000000000002', 'Biomolecules & Polymers', 10)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('690a1f51-c6e5-4c6e-a620-20720b3fd7b8', '5cb2e242-0075-4fd2-a2a2-46b4cedf34e1', 'Carbohydrates & Glucose', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('c145bf6f-a18e-455d-a07f-1bb1f874a9f6', '5cb2e242-0075-4fd2-a2a2-46b4cedf34e1', 'Amino Acids & Peptides', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('227a18d1-56a6-4cbe-a76c-f132ed14d434', '5cb2e242-0075-4fd2-a2a2-46b4cedf34e1', 'Addition & Condensation Polymers', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('1f8b186f-64e9-40a3-af44-11f5ccf63d40', '5cb2e242-0075-4fd2-a2a2-46b4cedf34e1', 'Vitamins & Nucleic Acids', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('fd3629b1-d688-4729-a91b-c6588d1d7e0c', '11111111-0000-0000-0000-000000000002', 'Surface Chemistry & Thermodynamics', 11)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('24fd880f-8ee4-46b1-a921-6034e5ba9458', 'fd3629b1-d688-4729-a91b-c6588d1d7e0c', 'Adsorption Isotherms', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('25a7eb29-c45c-4fcd-a422-c4a32c124861', 'fd3629b1-d688-4729-a91b-c6588d1d7e0c', 'Colloids & Tyndall Effect', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('cc1e0f0a-de6c-4397-ab3d-81f26baba4f6', 'fd3629b1-d688-4729-a91b-c6588d1d7e0c', 'Enthalpy & Entropy', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('5b681706-7ab3-42ef-a2b8-63d2110580c0', 'fd3629b1-d688-4729-a91b-c6588d1d7e0c', 'Gibbs Free Energy', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('c64f775f-ece4-4e6d-ac17-240f89ff14e7', '11111111-0000-0000-0000-000000000003', 'Calculus: Limits, Continuity & Differentiability', 1)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('4b82d0ec-ef45-4a88-a19d-6c687c933401', 'c64f775f-ece4-4e6d-ac17-240f89ff14e7', 'LHospitals Rule', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('b86ffe90-fd71-447c-afd0-3a357d6ceced', 'c64f775f-ece4-4e6d-ac17-240f89ff14e7', 'Continuity Criteria', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('bdea3453-7c4d-4a36-a300-a5a438a3fb4c', 'c64f775f-ece4-4e6d-ac17-240f89ff14e7', 'Differentiability Analysis', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('b9aed5c1-4912-4806-ae13-28db8414301e', 'c64f775f-ece4-4e6d-ac17-240f89ff14e7', 'Standard Limits', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('6a7d4781-8b91-44df-abb2-a58e654f2bff', '11111111-0000-0000-0000-000000000003', 'Calculus: Application of Derivatives', 2)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('a463cd07-ce5d-41cf-a79c-f25874723f8f', '6a7d4781-8b91-44df-abb2-a58e654f2bff', 'Monotonicity & Extrema', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('1b2bbc68-d8fd-43ce-ad22-6dba0184fffa', '6a7d4781-8b91-44df-abb2-a58e654f2bff', 'Tangents and Normals', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('1eeeb95a-aa23-4e91-a27a-949af1300df0', '6a7d4781-8b91-44df-abb2-a58e654f2bff', 'Rate Measure', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('3b41b128-4126-493d-a5e9-e59428d225cc', '6a7d4781-8b91-44df-abb2-a58e654f2bff', 'Mean Value Theorems', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('83ef5bd1-36dd-4ca7-a678-7fe13594e09d', '11111111-0000-0000-0000-000000000003', 'Calculus: Indefinite & Definite Integrals', 3)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('1231ef31-5607-4c30-aca0-aa7af23fcfd7', '83ef5bd1-36dd-4ca7-a678-7fe13594e09d', 'Integration by Substitution', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('6a83f339-3cd3-4b97-afdf-0aa681d155ee', '83ef5bd1-36dd-4ca7-a678-7fe13594e09d', 'Definite Integral Properties', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('71e2ced5-de4d-4b45-abf7-09826a8ad34a', '83ef5bd1-36dd-4ca7-a678-7fe13594e09d', 'Leibnitz Integral Rule', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('e290c846-6ab3-4d31-ad36-4d56ada4964d', '83ef5bd1-36dd-4ca7-a678-7fe13594e09d', 'Reduction Formulas', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('de73e2fe-224b-447a-ad56-0d2eae35072c', '11111111-0000-0000-0000-000000000003', 'Calculus: Differential Equations & Area', 4)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('d745a297-6339-465b-a75d-617c2a6d0e81', 'de73e2fe-224b-447a-ad56-0d2eae35072c', 'Variable Separable Method', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('2c07eae6-8d06-4006-a881-5f20264d2a33', 'de73e2fe-224b-447a-ad56-0d2eae35072c', 'Linear Differential Equations', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('4767a1c1-bf60-4979-a836-09f4a3a020c1', 'de73e2fe-224b-447a-ad56-0d2eae35072c', 'Homogeneous Equations', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('90e805b9-162d-4658-a3d1-e604e5b2149b', 'de73e2fe-224b-447a-ad56-0d2eae35072c', 'Area under Curves', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('4bcf925f-6876-4f0d-ae61-c3c89a456425', '11111111-0000-0000-0000-000000000003', 'Algebra: Matrices & Determinants', 5)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('ccf87fc7-8da1-42de-a127-1318e5d7eaa8', '4bcf925f-6876-4f0d-ae61-c3c89a456425', 'Matrix Multiplication & Inverse', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('f09e832d-6504-4f4a-a0bd-036302d650cb', '4bcf925f-6876-4f0d-ae61-c3c89a456425', 'Properties of Determinants', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('1c11f4f9-8ffe-4217-a76c-0e27831015be', '4bcf925f-6876-4f0d-ae61-c3c89a456425', 'System of Linear Equations', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('1b19fd89-cf71-42b7-aab8-14527eaf43f1', '4bcf925f-6876-4f0d-ae61-c3c89a456425', 'Eigenvalues & Cayley-Hamilton', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('0b271bfc-cab4-4d46-ae35-d1b0304e2f87', '11111111-0000-0000-0000-000000000003', 'Algebra: Complex Numbers & Quadratic Equations', 6)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('d9cf5ba1-1c57-49f5-a6c2-159699967b33', '0b271bfc-cab4-4d46-ae35-d1b0304e2f87', 'Euler & De Moivre Form', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('62eabc7f-948a-4ca7-a88c-a9c3b6106de7', '0b271bfc-cab4-4d46-ae35-d1b0304e2f87', 'Roots of Unity', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('058e5294-aefd-480c-a13f-7ccdaf0944e2', '0b271bfc-cab4-4d46-ae35-d1b0304e2f87', 'Nature of Roots', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('92130de1-d30c-466f-ae4a-e46ca842492c', '0b271bfc-cab4-4d46-ae35-d1b0304e2f87', 'Quadratic Inequalities', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('691f4024-361c-46dc-a157-a573486e01e6', '11111111-0000-0000-0000-000000000003', 'Algebra: Permutations, Combinations & Probability', 7)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('bdfba6de-ff77-4368-a01d-e274ad9baf17', '691f4024-361c-46dc-a157-a573486e01e6', 'Circular & Constrained Permutations', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('6b2abf28-5292-421b-a4d8-1dbfe361a0ad', '691f4024-361c-46dc-a157-a573486e01e6', 'Bayes Theorem', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('c1ff25d7-a3be-4214-a5c2-bd5c2476f66e', '691f4024-361c-46dc-a157-a573486e01e6', 'Conditional Probability', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('53e24bfb-141f-4ffb-a5ce-64cab1c79f0f', '691f4024-361c-46dc-a157-a573486e01e6', 'Binomial Distribution', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('30f11af4-d7b6-4fce-a61e-86df5b4413f2', '11111111-0000-0000-0000-000000000003', 'Algebra: Sequences, Series & Binomial Theorem', 8)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('40a242b3-1c60-4601-a38c-c77fa1a9a799', '30f11af4-d7b6-4fce-a61e-86df5b4413f2', 'Arithmetic & Geometric Progressions', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('59dddf98-9728-48f8-a51e-d0230fb63004', '30f11af4-d7b6-4fce-a61e-86df5b4413f2', 'Arithmetico-Geometric Series', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('3fb45ebb-8a6a-49fc-a29e-1d36022376d5', '30f11af4-d7b6-4fce-a61e-86df5b4413f2', 'General Term in Binomial', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('ef7482b7-887b-478b-a031-67fe4be97c4f', '30f11af4-d7b6-4fce-a61e-86df5b4413f2', 'Greatest Term in Expansion', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('0ce09a69-e927-4935-ad81-fb61a1211695', '11111111-0000-0000-0000-000000000003', 'Coordinate Geometry: Circles & Conics', 9)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('49c61b95-7f4a-4e0f-a9bc-4b11f5eb339b', '0ce09a69-e927-4935-ad81-fb61a1211695', 'Equations of Circles & Orthogonality', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('ef1f55fa-c703-4937-a1a5-1345bf721a39', '0ce09a69-e927-4935-ad81-fb61a1211695', 'Parabola Standard Forms', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('0b8591f4-f3d7-437c-a0c1-a2fd59409bee', '0ce09a69-e927-4935-ad81-fb61a1211695', 'Ellipse & Hyperbola Tangents', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('3ed57c85-2c60-48c4-aa5b-d4634fafc489', '0ce09a69-e927-4935-ad81-fb61a1211695', 'Eccentricity Calculations', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('c802774f-4126-4903-a5dd-95bd24b982d0', '11111111-0000-0000-0000-000000000003', 'Vectors & 3D Geometry', 10)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('bf6fba9f-30c5-4d42-a2b5-0b4a4822df4c', 'c802774f-4126-4903-a5dd-95bd24b982d0', 'Dot and Cross Products', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('775d2458-7b08-454c-a66a-1e89b1cfaced', 'c802774f-4126-4903-a5dd-95bd24b982d0', 'Scalar Triple Product', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('60744144-0094-4877-a399-a8ca8f7959f5', 'c802774f-4126-4903-a5dd-95bd24b982d0', 'Shortest Distance Between Skew Lines', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('237c2ed1-4266-438e-a8b9-f132c7bae245', 'c802774f-4126-4903-a5dd-95bd24b982d0', 'Equation of Plane & Line', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('a81241a6-c421-4cdb-a086-b7c2f3bb2b7b', '11111111-0000-0000-0000-000000000003', 'Trigonometry & Inverse Trigonometry', 11)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('c7f89b6d-f532-4e7f-a15c-f49872cb041a', 'a81241a6-c421-4cdb-a086-b7c2f3bb2b7b', 'Compound Angle Identities', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('ce026d2c-f24e-42b9-ac2b-41279ea1902a', 'a81241a6-c421-4cdb-a086-b7c2f3bb2b7b', 'Trigonometric Equations', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('2ed78f4b-a160-4729-ab53-320c8a727ab9', 'a81241a6-c421-4cdb-a086-b7c2f3bb2b7b', 'Inverse Function Properties', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('980b11cc-ab16-4bf1-a36f-7018f99ec747', 'a81241a6-c421-4cdb-a086-b7c2f3bb2b7b', 'Heights and Distances', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('8d5e313a-d8b9-4387-a5bd-372a94a3b4ff', '11111111-0000-0000-0000-000000000004', 'Cell Biology & Genetics', 1)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('6dccc1c4-ba60-4576-a7cd-070828c2c754', '8d5e313a-d8b9-4387-a5bd-372a94a3b4ff', 'Cell Cycle & Mitosis', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('aaec2e87-b5df-4388-a147-0e2bbad8294f', '8d5e313a-d8b9-4387-a5bd-372a94a3b4ff', 'Mendelian Inheritance', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('043b8c49-8a05-4a1e-ab63-515a1ac4597b', '8d5e313a-d8b9-4387-a5bd-372a94a3b4ff', 'Molecular Basis of Inheritance', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('6f293e50-4861-4e2d-aa60-8bc088373c52', '8d5e313a-d8b9-4387-a5bd-372a94a3b4ff', 'DNA Replication', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('b9fca1bf-bb24-40dd-af41-f0a5803b674d', '11111111-0000-0000-0000-000000000004', 'Human Physiology', 2)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('251ec8a9-6e9f-42d2-ae22-f556530bdcc3', 'b9fca1bf-bb24-40dd-af41-f0a5803b674d', 'Digestive System', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('d612569f-add6-4059-af78-48541b6b0d52', 'b9fca1bf-bb24-40dd-af41-f0a5803b674d', 'Neural Control & Coordination', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('7e05169c-db8e-4c19-a68f-b92b303e33bc', 'b9fca1bf-bb24-40dd-af41-f0a5803b674d', 'Chemical Coordination & Hormones', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('33ea8023-d12e-4dfe-a511-f54e8045036e', 'b9fca1bf-bb24-40dd-af41-f0a5803b674d', 'Circulatory System', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.chapters (id, subject_id, name, order_index)
VALUES ('40641152-72c0-4316-aa83-0d8018404f3a', '11111111-0000-0000-0000-000000000004', 'Plant Physiology & Ecology', 3)
ON CONFLICT (subject_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('63b07f3b-5d40-4cbb-aaf7-8473fdfb16fc', '40641152-72c0-4316-aa83-0d8018404f3a', 'Photosynthesis in Higher Plants', 1)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('3c45058a-9134-433a-a8e3-04bba37112c5', '40641152-72c0-4316-aa83-0d8018404f3a', 'Plant Growth & Development', 2)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('576b707d-16ae-470f-a89c-02129ea55554', '40641152-72c0-4316-aa83-0d8018404f3a', 'Ecosystem & Energy Flow', 3)
ON CONFLICT (chapter_id, name) DO NOTHING;
INSERT INTO public.topics (id, chapter_id, name, order_index)
VALUES ('4174d1f1-7bb3-4544-ac22-7d2baef64daf', '40641152-72c0-4316-aa83-0d8018404f3a', 'Biodiversity Conservation', 4)
ON CONFLICT (chapter_id, name) DO NOTHING;
