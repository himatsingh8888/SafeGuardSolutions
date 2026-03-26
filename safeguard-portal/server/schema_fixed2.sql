--
-- PostgreSQL database dump (fixed)
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- ----------------------------
-- TABLE DEFINITIONS
-- ----------------------------

CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'technician', 'client'))
);
CREATE UNIQUE INDEX one_admin ON public.users ((role)) WHERE role = 'admin';

CREATE TABLE public.system (
    systemid integer NOT NULL,
    status character varying(100) NOT NULL,
    installdate date NOT NULL,
    warrantyinfo text,
    CONSTRAINT system_installdate_check CHECK ((installdate <= CURRENT_DATE)),
    CONSTRAINT system_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying, 'Maintenance'::character varying])::text[])))
);
ALTER TABLE public.system OWNER TO postgres;

CREATE SEQUENCE public.system_systemid_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.system_systemid_seq OWNER TO postgres;
ALTER SEQUENCE public.system_systemid_seq OWNED BY public.system.systemid;
ALTER TABLE ONLY public.system ALTER COLUMN systemid SET DEFAULT nextval('public.system_systemid_seq'::regclass);

CREATE TABLE public.accesscontrolsystem (
    systemid integer NOT NULL,
    numofdoorscontrolled integer NOT NULL,
    controllertype character varying(100) NOT NULL,
    hasdoorbellintegration boolean DEFAULT false NOT NULL,
    credentialtype character varying(100) NOT NULL,
    CONSTRAINT accesscontrolsystem_controllertype_check CHECK (((controllertype)::text = ANY ((ARRAY['AJAX'::character varying, 'ICT'::character varying, 'Inaxsys'::character varying])::text[]))),
    CONSTRAINT accesscontrolsystem_credentialtype_check CHECK (((credentialtype)::text = ANY ((ARRAY['fob'::character varying, 'keypad'::character varying, 'mobile'::character varying, 'mixed'::character varying])::text[]))),
    CONSTRAINT accesscontrolsystem_numofdoorscontrolled_check CHECK ((numofdoorscontrolled >= 0))
);
ALTER TABLE public.accesscontrolsystem OWNER TO postgres;

CREATE TABLE public.alarmsystem (
    systemid integer NOT NULL,
    numberofsensors integer NOT NULL,
    monitoringtype character varying(100) NOT NULL,
    controlpanelmodel character varying(100) NOT NULL,
    hasmobileintegration boolean DEFAULT false NOT NULL,
    CONSTRAINT alarmsystem_monitoringtype_check CHECK (((monitoringtype)::text = ANY ((ARRAY['self-monitoring'::character varying, 'professional monitoring'::character varying])::text[]))),
    CONSTRAINT alarmsystem_numberofsensors_check CHECK ((numberofsensors >= 0))
);
ALTER TABLE public.alarmsystem OWNER TO postgres;

CREATE TABLE public.camerasystem (
    systemid integer NOT NULL,
    numofcamera integer NOT NULL,
    recordingtype character varying(100) NOT NULL,
    resolutionstandard character varying(100) NOT NULL,
    storagecapacity integer NOT NULL,
    CONSTRAINT camerasystem_numofcamera_check CHECK ((numofcamera >= 0)),
    CONSTRAINT camerasystem_recordingtype_check CHECK (((recordingtype)::text = ANY ((ARRAY['NVR'::character varying, 'DVD'::character varying, 'Cloud'::character varying])::text[]))),
    CONSTRAINT camerasystem_resolutionstandard_check CHECK (((resolutionstandard)::text = ANY ((ARRAY['720p'::character varying, '1080p'::character varying, '4K'::character varying, 'HD'::character varying])::text[]))),
    CONSTRAINT camerasystem_storagecapacity_check CHECK ((storagecapacity >= 0))
);
ALTER TABLE public.camerasystem OWNER TO postgres;

CREATE TABLE public.client (
    clientid integer NOT NULL,
    fname character varying(50) NOT NULL,
    lname character varying(50) NOT NULL,
    billingaddress character varying(225) NOT NULL,
    customertype character varying(20) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(15),
    CONSTRAINT client_customertype_check CHECK (((customertype)::text = ANY ((ARRAY['Residential'::character varying, 'Commercial'::character varying])::text[]))),
    CONSTRAINT client_email_check CHECK (((email)::text ~~ '%@%.%'::text)),
    CONSTRAINT client_phone_check CHECK ((length((phone)::text) >= 7))
);
ALTER TABLE public.client OWNER TO postgres;

CREATE SEQUENCE public.client_clientid_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.client_clientid_seq OWNER TO postgres;
ALTER SEQUENCE public.client_clientid_seq OWNED BY public.client.clientid;
ALTER TABLE ONLY public.client ALTER COLUMN clientid SET DEFAULT nextval('public.client_clientid_seq'::regclass);

CREATE TABLE public.employee (
    employeeid integer NOT NULL,
    fname character varying(50) NOT NULL,
    lname character varying(50) NOT NULL,
    wage numeric(10,2) NOT NULL,
    email character varying(100),
    phonenum character varying(15) NOT NULL,
    CONSTRAINT employee_email_check CHECK (((email)::text ~~ '%@%.%'::text)),
    CONSTRAINT employee_wage_check CHECK ((wage >= (0)::numeric))
);
ALTER TABLE public.employee OWNER TO postgres;

CREATE SEQUENCE public.employee_employeeid_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.employee_employeeid_seq OWNER TO postgres;
ALTER SEQUENCE public.employee_employeeid_seq OWNED BY public.employee.employeeid;
ALTER TABLE ONLY public.employee ALTER COLUMN employeeid SET DEFAULT nextval('public.employee_employeeid_seq'::regclass);

CREATE TABLE public.employeeskill (
    employeeid integer NOT NULL,
    skill character varying(50) NOT NULL
);
ALTER TABLE public.employeeskill OWNER TO postgres;

CREATE TABLE public.location (
    siteid integer NOT NULL,
    address character varying(255) NOT NULL,
    description text,
    client integer NOT NULL
);
ALTER TABLE public.location OWNER TO postgres;

CREATE SEQUENCE public.location_siteid_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.location_siteid_seq OWNER TO postgres;
ALTER SEQUENCE public.location_siteid_seq OWNED BY public.location.siteid;
ALTER TABLE ONLY public.location ALTER COLUMN siteid SET DEFAULT nextval('public.location_siteid_seq'::regclass);

CREATE TABLE public.installation (
    installationid integer NOT NULL,
    siteid integer NOT NULL,
    scheduleddate date NOT NULL,
    internalcost numeric(10,2) NOT NULL,
    price numeric(10,2) NOT NULL,
    techniciannumbs integer NOT NULL,
    description text,
    status character varying(50) NOT NULL,
    completeddate date,
    CONSTRAINT installation_check CHECK ((completeddate >= scheduleddate)),
    CONSTRAINT installation_internalcost_check CHECK ((internalcost >= (0)::numeric)),
    CONSTRAINT installation_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT installation_scheduleddate_check CHECK ((scheduleddate >= CURRENT_DATE)),
    CONSTRAINT installation_status_check CHECK (((status)::text = ANY ((ARRAY['Scheduled'::character varying, 'In Progress'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT installation_techniciannumbs_check CHECK ((techniciannumbs >= 0))
);
ALTER TABLE public.installation OWNER TO postgres;

CREATE SEQUENCE public.installation_installationid_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.installation_installationid_seq OWNER TO postgres;
ALTER SEQUENCE public.installation_installationid_seq OWNED BY public.installation.installationid;
ALTER TABLE ONLY public.installation ALTER COLUMN installationid SET DEFAULT nextval('public.installation_installationid_seq'::regclass);

CREATE TABLE public.inventory (
    inventoryid integer NOT NULL,
    itemtype character varying(200) NOT NULL,
    suppliercompany character varying(100) NOT NULL,
    dateofpurchase date NOT NULL,
    warranty date,
    quantity integer NOT NULL,
    CONSTRAINT inventory_dateofpurchase_check CHECK ((dateofpurchase <= CURRENT_DATE)),
    CONSTRAINT inventory_quantity_check CHECK ((quantity >= 0))
);
ALTER TABLE public.inventory OWNER TO postgres;

CREATE SEQUENCE public.inventory_inventoryid_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.inventory_inventoryid_seq OWNER TO postgres;
ALTER SEQUENCE public.inventory_inventoryid_seq OWNED BY public.inventory.inventoryid;
ALTER TABLE ONLY public.inventory ALTER COLUMN inventoryid SET DEFAULT nextval('public.inventory_inventoryid_seq'::regclass);

CREATE TABLE public.assignment (
    employeeid integer NOT NULL,
    installationid integer NOT NULL,
    hoursworked numeric(5,2),
    CONSTRAINT assignment_hoursworked_check CHECK ((hoursworked >= (0)::numeric))
);
ALTER TABLE public.assignment OWNER TO postgres;

CREATE TABLE public.installusage (
    inventoryid integer NOT NULL,
    systemid integer NOT NULL,
    installationid integer NOT NULL
);
ALTER TABLE public.installusage OWNER TO postgres;

CREATE TABLE public.payment (
    paymentid integer NOT NULL,
    status character varying(20) NOT NULL,
    duedate date NOT NULL,
    createdate date NOT NULL,
    totalamount numeric(10,2) NOT NULL,
    paymenttype character varying(20),
    client integer NOT NULL,
    CONSTRAINT payment_paymenttype_check CHECK (((paymenttype)::text = ANY ((ARRAY['Credit Card'::character varying, 'Debit'::character varying, 'Cash'::character varying, 'Bank Transfer'::character varying])::text[]))),
    CONSTRAINT payment_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Paid'::character varying, 'Overdue'::character varying])::text[]))),
    CONSTRAINT payment_totalamount_check CHECK ((totalamount >= (0)::numeric))
);
ALTER TABLE public.payment OWNER TO postgres;

CREATE SEQUENCE public.payment_paymentid_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.payment_paymentid_seq OWNER TO postgres;
ALTER SEQUENCE public.payment_paymentid_seq OWNED BY public.payment.paymentid;
ALTER TABLE ONLY public.payment ALTER COLUMN paymentid SET DEFAULT nextval('public.payment_paymentid_seq'::regclass);

CREATE TABLE public.reviews (
    reviewid integer NOT NULL,
    reviewcomment text,
    reviewname character varying(100),
    rating integer,
    reviewdate date NOT NULL,
    client integer NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 0) AND (rating <= 5)))
);
ALTER TABLE public.reviews OWNER TO postgres;

CREATE SEQUENCE public.reviews_reviewid_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.reviews_reviewid_seq OWNER TO postgres;
ALTER SEQUENCE public.reviews_reviewid_seq OWNED BY public.reviews.reviewid;
ALTER TABLE ONLY public.reviews ALTER COLUMN reviewid SET DEFAULT nextval('public.reviews_reviewid_seq'::regclass);

CREATE TABLE public.servicevisit (
    visitnumber integer NOT NULL,
    installationid integer NOT NULL,
    visitdate date NOT NULL,
    visittype character varying(50) NOT NULL,
    notes text,
    outcomestatus character varying(50) NOT NULL,
    CONSTRAINT servicevisit_outcomestatus_check CHECK (((outcomestatus)::text = ANY ((ARRAY['Completed'::character varying, 'Pending'::character varying, 'Follow-up required'::character varying])::text[]))),
    CONSTRAINT servicevisit_visittype_check CHECK (((visittype)::text = ANY ((ARRAY['Upgrade'::character varying, 'Repair'::character varying, 'Inspection'::character varying])::text[])))
);
ALTER TABLE public.servicevisit OWNER TO postgres;

CREATE SEQUENCE public.servicevisit_visitnumber_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER TABLE public.servicevisit_visitnumber_seq OWNER TO postgres;
ALTER SEQUENCE public.servicevisit_visitnumber_seq OWNED BY public.servicevisit.visitnumber;
ALTER TABLE ONLY public.servicevisit ALTER COLUMN visitnumber SET DEFAULT nextval('public.servicevisit_visitnumber_seq'::regclass);

-- ----------------------------
-- PRIMARY KEY CONSTRAINTS
-- ----------------------------

ALTER TABLE ONLY public.system         ADD CONSTRAINT system_pkey PRIMARY KEY (systemid);
ALTER TABLE ONLY public.accesscontrolsystem ADD CONSTRAINT accesscontrolsystem_pkey PRIMARY KEY (systemid);
ALTER TABLE ONLY public.alarmsystem    ADD CONSTRAINT alarmsystem_pkey PRIMARY KEY (systemid);
ALTER TABLE ONLY public.camerasystem   ADD CONSTRAINT camerasystem_pkey PRIMARY KEY (systemid);
ALTER TABLE ONLY public.client         ADD CONSTRAINT client_pkey PRIMARY KEY (clientid);
ALTER TABLE ONLY public.client         ADD CONSTRAINT client_email_key UNIQUE (email);
ALTER TABLE ONLY public.employee       ADD CONSTRAINT employee_pkey PRIMARY KEY (employeeid);
ALTER TABLE ONLY public.employeeskill  ADD CONSTRAINT employeeskill_pkey PRIMARY KEY (employeeid, skill);
ALTER TABLE ONLY public.location       ADD CONSTRAINT location_pkey PRIMARY KEY (siteid);
ALTER TABLE ONLY public.installation   ADD CONSTRAINT installation_pkey PRIMARY KEY (installationid);
ALTER TABLE ONLY public.inventory      ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventoryid);
ALTER TABLE ONLY public.installusage   ADD CONSTRAINT installusage_pkey PRIMARY KEY (inventoryid, systemid, installationid);
ALTER TABLE ONLY public.payment        ADD CONSTRAINT payment_pkey PRIMARY KEY (paymentid);
ALTER TABLE ONLY public.reviews        ADD CONSTRAINT reviews_pkey PRIMARY KEY (reviewid);
ALTER TABLE ONLY public.servicevisit   ADD CONSTRAINT servicevisit_pkey PRIMARY KEY (visitnumber, installationid);
ALTER TABLE ONLY public.assignment     ADD CONSTRAINT assignment_pkey PRIMARY KEY (employeeid, installationid);

-- ----------------------------
-- FOREIGN KEY CONSTRAINTS
-- ----------------------------

ALTER TABLE ONLY public.accesscontrolsystem
    ADD CONSTRAINT accesscontrolsystem_systemid_fkey FOREIGN KEY (systemid) REFERENCES public.system(systemid) ON DELETE CASCADE;

ALTER TABLE ONLY public.alarmsystem
    ADD CONSTRAINT alarmsystem_systemid_fkey FOREIGN KEY (systemid) REFERENCES public.system(systemid) ON DELETE CASCADE;

ALTER TABLE ONLY public.camerasystem
    ADD CONSTRAINT camerasystem_systemid_fkey FOREIGN KEY (systemid) REFERENCES public.system(systemid) ON DELETE CASCADE;

ALTER TABLE ONLY public.employeeskill
    ADD CONSTRAINT employeeskill_employeeid_fkey FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid) ON DELETE CASCADE;

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_client_fkey FOREIGN KEY (client) REFERENCES public.client(clientid);

ALTER TABLE ONLY public.installation
    ADD CONSTRAINT installation_siteid_fkey FOREIGN KEY (siteid) REFERENCES public.location(siteid);

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_employeeid_fkey FOREIGN KEY (employeeid) REFERENCES public.employee(employeeid) ON DELETE CASCADE;

ALTER TABLE ONLY public.assignment
    ADD CONSTRAINT assignment_installationid_fkey FOREIGN KEY (installationid) REFERENCES public.installation(installationid) ON DELETE CASCADE;

ALTER TABLE ONLY public.installusage
    ADD CONSTRAINT installusage_installationid_fkey FOREIGN KEY (installationid) REFERENCES public.installation(installationid) ON DELETE CASCADE;

ALTER TABLE ONLY public.installusage
    ADD CONSTRAINT installusage_inventoryid_fkey FOREIGN KEY (inventoryid) REFERENCES public.inventory(inventoryid) ON DELETE CASCADE;

ALTER TABLE ONLY public.installusage
    ADD CONSTRAINT installusage_systemid_fkey FOREIGN KEY (systemid) REFERENCES public.system(systemid) ON DELETE CASCADE;

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_client_fkey FOREIGN KEY (client) REFERENCES public.client(clientid);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_client_fkey FOREIGN KEY (client) REFERENCES public.client(clientid);

ALTER TABLE ONLY public.servicevisit
    ADD CONSTRAINT servicevisit_installationid_fkey FOREIGN KEY (installationid) REFERENCES public.installation(installationid) ON DELETE CASCADE;

-- ----------------------------
-- DATA: system (must come before child tables)
-- ----------------------------

INSERT INTO public.system (systemid, status, installdate, warrantyinfo) VALUES
(1,  'Active',      '2024-02-10', '2 year warranty'),
(2,  'Maintenance', '2023-11-05', '1 year warranty'),
(3,  'Active',      '2024-08-18', '3 year warranty'),
(4,  'Inactive',    '2023-04-22', '1 year warranty'),
(5,  'Active',      '2025-03-01', '2 year warranty'),
(6,  'Active',      '2024-05-14', '1 year warranty'),
(7,  'Inactive',    '2023-09-30', '2 year warranty'),
(8,  'Active',      '2024-12-01', '3 year warranty'),
(9,  'Maintenance', '2024-06-20', '1 year warranty'),
(10, 'Active',      '2025-02-15', '2 year warranty'),
(11, 'Active',      '2024-01-15', '2 year warranty'),
(12, 'Active',      '2024-03-20', '1 year warranty'),
(13, 'Inactive',    '2023-06-10', '1 year warranty'),
(14, 'Maintenance', '2024-07-01', '2 year warranty'),
(15, 'Active',      '2025-01-05', '3 year warranty');

SELECT pg_catalog.setval('public.system_systemid_seq', 15, true);

-- ----------------------------
-- DATA: alarmsystem
-- ----------------------------

INSERT INTO public.alarmsystem (systemid, numberofsensors, monitoringtype, controlpanelmodel, hasmobileintegration) VALUES
(1, 8,  'professional monitoring', 'DSC PowerSeries',       true),
(2, 5,  'self-monitoring',         'Bosch Solution 3000',   false),
(3, 12, 'professional monitoring', 'Honeywell Vista 20P',   true),
(4, 6,  'self-monitoring',         'DSC NEO HS2032',        false),
(5, 10, 'professional monitoring', 'Texecom Premier 48',    true);

-- ----------------------------
-- DATA: camerasystem
-- ----------------------------

INSERT INTO public.camerasystem (systemid, numofcamera, recordingtype, resolutionstandard, storagecapacity) VALUES
(6,  4,  'NVR',   '1080p', 500),
(7,  8,  'Cloud', '4K',    1000),
(8,  2,  'DVD',   '720p',  250),
(9,  6,  'NVR',   '4K',    2000),
(10, 16, 'Cloud', '1080p', 5000);

-- ----------------------------
-- DATA: accesscontrolsystem
-- ----------------------------

INSERT INTO public.accesscontrolsystem (systemid, numofdoorscontrolled, controllertype, hasdoorbellintegration, credentialtype) VALUES
(11, 2, 'AJAX',    true,  'fob'),
(12, 5, 'ICT',     false, 'keypad'),
(13, 3, 'Inaxsys', true,  'mobile'),
(14, 8, 'AJAX',    false, 'mixed'),
(15, 1, 'ICT',     true,  'fob');

-- ----------------------------
-- DATA: client
-- ----------------------------

INSERT INTO public.client (clientid, fname, lname, billingaddress, customertype, email, phone) VALUES
(1, 'John',  'Smith', '123 Main St', 'Residential', 'john@email.com',  '7781111111'),
(2, 'Sarah', 'Lee',   '45 Oak Ave',  'Commercial',  'sarah@email.com', '7782222222'),
(3, 'Mike',  'Brown', '9 Pine Rd',   'Residential', 'mike@email.com',  '7783333333'),
(4, 'Lisa',  'Green', '77 King St',  'Commercial',  'lisa@email.com',  '7784444444'),
(5, 'Tom',   'White', '88 Maple Dr', 'Residential', 'tom@email.com',   '7785555555');

SELECT pg_catalog.setval('public.client_clientid_seq', 5, true);

-- ----------------------------
-- DATA: employee
-- ----------------------------

INSERT INTO public.employee (employeeid, fname, lname, wage, email, phonenum) VALUES
(1, 'Alice', 'Wong',   25.00, 'alice@company.com', '6041111111'),
(2, 'Bob',   'Chan',   30.00, 'bob@company.com',   '6042222222'),
(3, 'Carol', 'Kim',    28.00, 'carol@company.com', '6043333333'),
(4, 'David', 'Patel',  32.00, 'david@company.com', '6044444444'),
(5, 'Eve',   'Nguyen', 27.00, 'eve@company.com',   '6045555555');

SELECT pg_catalog.setval('public.employee_employeeid_seq', 5, true);

-- ----------------------------
-- DATA: employeeskill
-- ----------------------------

INSERT INTO public.employeeskill (employeeid, skill) VALUES
(1, 'Camera Installation'),
(1, 'Alarm Systems'),
(2, 'Access Control'),
(3, 'Network Setup'),
(4, 'Camera Installation'),
(5, 'Alarm Systems');

-- ----------------------------
-- DATA: location
-- ----------------------------

INSERT INTO public.location (siteid, address, description, client) VALUES
(1, '123 Main St', 'Residential home', 1),
(2, '45 Oak Ave',  'Office building',  2),
(3, '9 Pine Rd',   'Residential home', 3),
(4, '77 King St',  'Retail store',     4),
(5, '88 Maple Dr', 'Residential home', 5);

SELECT pg_catalog.setval('public.location_siteid_seq', 5, true);

-- ----------------------------
-- DATA: inventory
-- ----------------------------

INSERT INTO public.inventory (inventoryid, itemtype, suppliercompany, dateofpurchase, warranty, quantity) VALUES
(1, 'Security Camera', 'TechCorp',   '2025-01-10', '2027-01-10', 20),
(2, 'Motion Sensor',   'SafeGuard',  '2025-02-15', '2027-02-15', 50),
(3, 'Control Panel',   'SecureBase', '2025-03-01', '2026-03-01', 10),
(4, 'Door Lock',       'LockMaster', '2025-04-20', '2027-04-20', 30),
(5, 'Keypad',          'AccessPro',  '2025-05-10', '2027-05-10', 25);

SELECT pg_catalog.setval('public.inventory_inventoryid_seq', 5, true);

-- ----------------------------
-- DATA: installation
-- ----------------------------

INSERT INTO public.installation (installationid, siteid, scheduleddate, internalcost, price, techniciannumbs, description, status, completeddate) VALUES
(1, 1, '2026-04-01', 200.00, 500.00, 2, 'Alarm installation',  'Scheduled', NULL),
(2, 2, '2026-04-05', 400.00, 900.00, 3, 'Camera setup',        'Scheduled', NULL),
(3, 3, '2026-04-10', 150.00, 400.00, 1, 'Access control',      'Scheduled', NULL),
(4, 4, '2026-04-15', 300.00, 700.00, 2, 'Full security setup', 'Scheduled', NULL),
(5, 5, '2026-04-20', 250.00, 600.00, 2, 'Camera installation', 'Scheduled', NULL);

SELECT pg_catalog.setval('public.installation_installationid_seq', 5, true);

-- ----------------------------
-- DATA: assignment
-- ----------------------------

INSERT INTO public.assignment (employeeid, installationid, hoursworked) VALUES
(1, 1, 6.00),
(2, 2, 8.50),
(3, 3, 4.00),
(4, 4, 7.75),
(5, 5, 5.50);

-- ----------------------------
-- DATA: installusage
-- ----------------------------

INSERT INTO public.installusage (inventoryid, systemid, installationid) VALUES
(1, 6,  1),
(2, 1,  1),
(3, 11, 3),
(4, 11, 3),
(5, 11, 3);

-- ----------------------------
-- DATA: payment
-- ----------------------------

INSERT INTO public.payment (paymentid, status, duedate, createdate, totalamount, paymenttype, client) VALUES
(1, 'Pending', '2026-04-01', '2026-03-01', 500.00,  'Credit Card',   1),
(2, 'Paid',    '2026-03-15', '2026-02-15', 1200.00, 'Bank Transfer', 2),
(3, 'Overdue', '2026-02-01', '2026-01-01', 750.00,  'Debit',         3),
(4, 'Pending', '2026-04-15', '2026-03-15', 300.00,  'Cash',          4),
(5, 'Paid',    '2026-03-10', '2026-02-10', 950.00,  'Credit Card',   5);

SELECT pg_catalog.setval('public.payment_paymentid_seq', 5, true);

-- ----------------------------
-- DATA: reviews
-- ----------------------------

INSERT INTO public.reviews (reviewid, reviewcomment, reviewname, rating, reviewdate, client) VALUES
(1, 'Great service, very professional team.',        'John Smith',  5, '2026-05-05', 1),
(2, 'Installation was quick and clean.',             'Sarah Lee',   4, '2026-05-08', 2),
(3, 'Took longer than expected but good result.',    'Mike Brown',  3, '2026-05-12', 3),
(4, 'Very satisfied with the security setup.',       'Lisa Green',  5, '2026-05-15', 4),
(5, 'I hated this company not good, never trust.',   'Tom White',   1, '2026-05-18', 5);

SELECT pg_catalog.setval('public.reviews_reviewid_seq', 5, true);

-- ----------------------------
-- DATA: servicevisit
-- ----------------------------

INSERT INTO public.servicevisit (visitnumber, installationid, visitdate, visittype, notes, outcomestatus) VALUES
(1, 1, '2026-05-01', 'Inspection', 'Routine post-install check',          'Completed'),
(2, 2, '2026-05-03', 'Repair',     'Camera feed buggy, fixed',            'Completed'),
(3, 3, '2026-05-10', 'Upgrade',    'Added keypad at rear entrance',       'Completed'),
(4, 4, '2026-05-15', 'Inspection', 'All sensors operational',             'Pending'),
(5, 5, '2026-05-20', 'Repair',     'DVR unit replaced, needs follow up',  'Follow-up required');

SELECT pg_catalog.setval('public.servicevisit_visitnumber_seq', 5, true);

--
-- PostgreSQL database dump complete
--
