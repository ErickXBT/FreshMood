--
-- PostgreSQL database dump
--

\restrict 7iw2ZqZTjbDEqkFXIyNkqIf82bjC4jQiHiMLhQ94hhexP6ljJgHu8ieDdbBfrAw

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

--
-- Name: admin_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_accounts (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    reset_otp text,
    reset_otp_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_accounts_id_seq OWNED BY public.admin_accounts.id;


--
-- Name: cashiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cashiers (
    id integer NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cashiers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cashiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cashiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cashiers_id_seq OWNED BY public.cashiers.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_items (
    id integer NOT NULL,
    category_id integer NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(12,2) NOT NULL,
    image_url text,
    available boolean DEFAULT true NOT NULL,
    is_best_seller boolean DEFAULT false NOT NULL
);


--
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    menu_item_id integer NOT NULL,
    menu_item_name text NOT NULL,
    menu_item_image_url text,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    notes text
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    table_number integer,
    customer_name text NOT NULL,
    customer_phone text,
    notes text,
    order_type text DEFAULT 'dine_in'::text NOT NULL,
    delivery_address text,
    status text DEFAULT 'pending'::text NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax numeric(12,2) NOT NULL,
    service_fee numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    cashier_name text,
    payment_method text,
    payment_status text DEFAULT 'unpaid'::text NOT NULL,
    estimated_minutes integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    method text NOT NULL,
    amount numeric(12,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reference_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tables (
    id integer NOT NULL,
    table_number integer NOT NULL,
    qr_code text NOT NULL,
    label text
);


--
-- Name: tables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tables_id_seq OWNED BY public.tables.id;


--
-- Name: admin_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts ALTER COLUMN id SET DEFAULT nextval('public.admin_accounts_id_seq'::regclass);


--
-- Name: cashiers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashiers ALTER COLUMN id SET DEFAULT nextval('public.cashiers_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: tables id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables ALTER COLUMN id SET DEFAULT nextval('public.tables_id_seq'::regclass);


--
-- Data for Name: admin_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_accounts (id, username, email, password_hash, reset_otp, reset_otp_expires_at, created_at) FROM stdin;
5	freshmood	ericksatria91@gmail.com	$2b$10$3VhCWvLJNL8y8Zv2IIrE6OBdCidCvQrTuR8gPUuuAabs3ixKu02OO	\N	\N	2026-05-29 06:19:27.012453+00
\.


--
-- Data for Name: cashiers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cashiers (id, name, is_active, created_at) FROM stdin;
1	Aditya	f	2026-05-25 01:03:27.648+00
2	seren	t	2026-05-25 23:58:31.895+00
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, sort_order) FROM stdin;
1	FreshFood	1
2	FreshDrink	2
3	Coffee & Tea	3
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menu_items (id, category_id, name, description, price, image_url, available, is_best_seller) FROM stdin;
4	1	Toast Matcha	Matcha cream toast dessert with premium matcha	10000.00	/images/menu/toast-matcha.png	f	t
2	1	Toast Tuna	Tuna toast sandwich with fresh vegetables	12000.00	/images/menu/toast-tuna.png	f	t
21	1	Pisang Sambal	Pisang goreng dengan saus sambal khas FreshMood	12000.00	/images/menu/pisang-sambal.png	f	f
23	1	Kebab	Kebab daging sapi dengan sayuran segar dan saus spesial	15000.00	/images/menu/kebab.png	f	f
24	1	Nasi Kulit Remes	Nasi dengan kulit ayam crispy dan sambal remes pedas	18000.00	/images/menu/nasi-kulit-remes.png	f	f
22	1	Sosis Goreng Mentega	Sosis goreng dengan mentega, gurih dan lezat	15000.00	/images/menu/sosis-goreng-mentega.png	f	f
25	2	Matcha Berry	Minuman segar matcha mix berry yang menyegarkan	15000.00	/images/menu/matcha-berry.png	f	f
8	2	Red Velvet	Smooth iced red velvet latte	12000.00	/images/menu/red-velvet.png	t	f
9	2	Taro	Creamy iced taro drink	12000.00	/images/menu/taro.png	t	f
10	2	Matcha	Premium iced matcha latte	12000.00	/images/menu/matcha-drink.png	t	f
11	2	Vanilla Latte	Sweet iced vanilla latte coffee	12000.00	/images/menu/vanilla-latte.png	t	f
12	2	Caramel Macchiato	Classic iced caramel macchiato	12000.00	/images/menu/caramel-macchiato.png	t	t
13	2	Brown Sugar	Trendy brown sugar milk drink	12000.00	/images/menu/brown-sugar.png	t	t
14	2	Avocado Coklat	Creamy avocado chocolate blended drink	10000.00	/images/menu/avocado-coklat.png	t	t
15	3	Lemon Tea	Refreshing iced lemon tea	10000.00	/images/menu/lemon-tea.png	t	f
20	3	Creamy Latte	Smooth and creamy latte coffee	15000.00	/images/menu/creamy-latte.png	t	f
16	3	Lychee Tea	Aromatic iced lychee tea	10000.00	/images/menu/lychee-tea.png	t	f
17	3	Manggo Tea	Tropical iced mango tea	10000.00	/images/menu/manggo-tea.png	t	f
18	3	Ice Coffee	Bold iced black coffee	12000.00	/images/menu/ice-coffee.png	t	f
3	1	Toast Coklat Oreo	Chocolate oreo cream toast dessert sandwich	10000.00	/images/menu/toast-coklat-oreo.png	t	t
19	3	Ice Kopi Gula Aren	Indonesian iced palm sugar coffee	15000.00	/images/menu/ice-kopi-gula-aren.png	t	f
30	2	Tropical Delight	Perpaduan buah tropis yang menyegarkan	12000.00	/images/menu/tropical-delight.png	t	f
5	1	Toast Tiramisu	Tiramisu cream toast dessert sandwich	10000.00	/images/menu/toast-tiramisu.png	t	t
31	3	Americano	Kopi hitam espresso murni yang kuat dan bold	10000.00	/images/menu/americano.png	t	f
32	3	Dirty Latte	Espresso di atas susu dingin yang creamy dan nikmat	12000.00	/images/menu/dirty-latte.png	t	f
1	1	Toast Ayam	Crispy chicken toast with cheese and fresh lettuce	15000.00	/images/menu/toast-ayam.png	t	t
27	2	Lemonade Squash	Lemonade soda segar dengan rasa lemon yang tajam	12000.00	/images/menu/lemonade-squash.png	t	f
26	2	Melon Squash	Minuman soda squash rasa melon yang fresh	12000.00	/images/menu/melon-squash.png	t	f
28	2	Pineapple Mix Berry	Perpaduan nanas segar dengan mixed berry	12000.00	/images/menu/pineapple-mix-berry.png	t	f
33	3	Peanut Butter Latte	Latte spesial dengan rasa kacang tanah yang kaya	15000.00	/images/menu/peanut-butter-latte.png	t	f
29	2	Manggo Sunset	Minuman mangga segar dengan gradasi warna cantik	12000.00	/images/menu/manggo-sunset.png	t	f
6	1	Kentang Goreng	Crispy golden french fries served with dipping sauce	15000.00	/images/menu/upload-1779675080144-p6tf2h.jpg	t	f
7	2	Coklat	Rich iced chocolate drink	12000.00	/images/menu/coklat.png	t	t
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, menu_item_id, menu_item_name, menu_item_image_url, quantity, unit_price, subtotal, notes) FROM stdin;
57	21	7	Coklat	/images/menu/coklat.png	2	12000.00	24000.00	\N
58	21	12	Caramel Macchiato	/images/menu/caramel-macchiato.png	1	12000.00	12000.00	\N
55	20	3	Toast Coklat Oreo	/images/menu/toast-coklat-oreo.png	1	10000.00	10000.00	\N
56	20	6	Kentang Goreng	/images/menu/upload-1779675080144-p6tf2h.jpg	2	15000.00	30000.00	\N
52	19	2	Toast Tuna	/images/menu/toast-tuna.png	1	12000.00	12000.00	\N
53	19	23	Kebab	/images/menu/kebab.png	1	15000.00	15000.00	\N
54	19	6	Kentang Goreng	/images/menu/upload-1779675080144-p6tf2h.jpg	1	15000.00	15000.00	\N
47	18	3	Toast Coklat Oreo	/images/menu/toast-coklat-oreo.png	1	10000.00	10000.00	\N
48	18	12	Caramel Macchiato	/images/menu/caramel-macchiato.png	1	12000.00	12000.00	\N
49	18	8	Red Velvet	/images/menu/red-velvet.png	1	12000.00	12000.00	\N
50	18	2	Toast Tuna	/images/menu/toast-tuna.png	1	12000.00	12000.00	\N
51	18	1	Toast Ayam	/images/menu/toast-ayam.png	1	15000.00	15000.00	\N
46	17	1	Toast Ayam	/images/menu/toast-ayam.png	1	15000.00	15000.00	\N
44	16	30	Tropical Delight	/images/menu/tropical-delight.png	1	12000.00	12000.00	\N
45	16	9	Taro	/images/menu/taro.png	1	12000.00	12000.00	\N
43	15	30	Tropical Delight	/images/menu/tropical-delight.png	4	12000.00	48000.00	\N
42	14	3	Toast Coklat Oreo	/images/menu/toast-coklat-oreo.png	3	10000.00	30000.00	\N
32	13	30	Tropical Delight	/images/menu/tropical-delight.png	1	12000.00	12000.00	\N
33	13	32	Dirty Latte	/images/menu/dirty-latte.png	1	12000.00	12000.00	\N
34	13	21	Pisang Sambal	/images/menu/pisang-sambal.png	1	12000.00	12000.00	\N
35	13	22	Sosis Goreng Mentega	/images/menu/sosis-goreng-mentega.png	1	15000.00	15000.00	\N
36	13	24	Nasi Kulit Remes	/images/menu/nasi-kulit-remes.png	1	18000.00	18000.00	\N
37	13	25	Matcha Berry	/images/menu/matcha-berry.png	1	15000.00	15000.00	\N
38	13	28	Pineapple Mix Berry	/images/menu/pineapple-mix-berry.png	1	12000.00	12000.00	\N
39	13	27	Lemonade Squash	/images/menu/lemonade-squash.png	1	12000.00	12000.00	\N
40	13	33	Peanut Butter Latte	/images/menu/peanut-butter-latte.png	2	15000.00	30000.00	\N
41	13	29	Manggo Sunset	/images/menu/manggo-sunset.png	2	12000.00	24000.00	\N
29	12	29	Manggo Sunset	/images/menu/manggo-sunset.png	1	12000.00	12000.00	\N
30	12	3	Toast Coklat Oreo	/images/menu/toast-coklat-oreo.png	1	10000.00	10000.00	\N
31	12	5	Toast Tiramisu	/images/menu/toast-tiramisu.png	1	10000.00	10000.00	\N
25	11	29	Manggo Sunset	/images/menu/manggo-sunset.png	1	12000.00	12000.00	\N
26	11	3	Toast Coklat Oreo	/images/menu/toast-coklat-oreo.png	1	10000.00	10000.00	\N
27	11	6	Kentang Goreng	/images/menu/kentang-goreng.png	1	15000.00	15000.00	\N
28	11	13	Brown Sugar	/images/menu/brown-sugar.png	1	12000.00	12000.00	\N
23	10	1	Toast Ayam	/images/menu/toast-ayam.png	1	15000.00	15000.00	\N
24	10	15	Lemon Tea	/images/menu/lemon-tea.png	1	10000.00	10000.00	\N
16	9	3	Toast Coklat Oreo	/images/menu/toast-coklat-oreo.png	1	10000.00	10000.00	\N
17	9	12	Caramel Macchiato	/images/menu/caramel-macchiato.png	1	12000.00	12000.00	\N
18	9	6	Kentang Goreng	/images/menu/kentang-goreng.png	1	15000.00	15000.00	\N
19	9	13	Brown Sugar	/images/menu/brown-sugar.png	2	12000.00	24000.00	\N
20	9	15	Lemon Tea	/images/menu/lemon-tea.png	1	10000.00	10000.00	\N
21	9	1	Toast Ayam	/images/menu/toast-ayam.png	1	15000.00	15000.00	\N
22	9	2	Toast Tuna	/images/menu/toast-tuna.png	2	12000.00	24000.00	\N
10	8	10	Matcha	/images/menu/matcha-drink.png	1	12000.00	12000.00	\N
11	8	1	Toast Ayam	/images/menu/toast-ayam.png	1	15000.00	15000.00	\N
12	8	12	Caramel Macchiato	/images/menu/caramel-macchiato.png	1	12000.00	12000.00	\N
13	8	13	Brown Sugar	/images/menu/brown-sugar.png	1	12000.00	12000.00	\N
14	8	6	Kentang Goreng	/images/menu/kentang-goreng.png	2	15000.00	30000.00	\N
15	8	3	Toast Coklat Oreo	/images/menu/toast-coklat-oreo.png	1	10000.00	10000.00	\N
8	7	3	Toast Coklat Oreo	/images/menu/toast-coklat-oreo.png	1	10000.00	10000.00	\N
9	7	6	Kentang Goreng	/images/menu/kentang-goreng.png	1	15000.00	15000.00	\N
3	6	3	Toast Coklat Oreo	/images/menu/toast-coklat-oreo.png	1	10000.00	10000.00	\N
4	6	5	Toast Tiramisu	/images/menu/toast-tiramisu.png	1	10000.00	10000.00	\N
5	6	6	Kentang Goreng	/images/menu/kentang-goreng.png	1	15000.00	15000.00	\N
6	6	12	Caramel Macchiato	/images/menu/caramel-macchiato.png	1	12000.00	12000.00	\N
7	6	13	Brown Sugar	/images/menu/brown-sugar.png	1	12000.00	12000.00	\N
1	5	2	Toast Tuna	/images/menu/toast-tuna.png	1	12000.00	12000.00	\N
2	5	13	Brown Sugar	/images/menu/brown-sugar.png	1	12000.00	12000.00	\N
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, table_number, customer_name, customer_phone, notes, order_type, delivery_address, status, subtotal, tax, service_fee, total, cashier_name, payment_method, payment_status, estimated_minutes, created_at, updated_at) FROM stdin;
21	\N	Auzy Citra	\N	\N	delivery	Apotek Sidodadi	completed	36000.00	0.00	0.00	36000.00	seren	DELIVERY_CASH	paid	\N	2026-05-26 04:03:59.045+00	2026-05-26 04:43:05.767+00
20	\N	avilla	\N	\N	delivery	klinik Muhammadiyah ende	completed	40000.00	0.00	5000.00	45000.00	seren	DELIVERY_CASH	paid	\N	2026-05-26 02:30:06.412+00	2026-05-26 02:30:32.945+00
19	\N	Novy	082147345958	\N	delivery	Jl. Sultan hasanudin wolowona , lorong kapela , rumah ketiga sebelah kiri cat abu	completed	42000.00	0.00	0.00	42000.00	Aditya	QRIS	paid	\N	2026-05-25 10:45:29.695+00	2026-05-26 01:51:58.207+00
18	1	Erick	081237582544	Less sugar	dine_in	\N	completed	61000.00	0.00	0.00	61000.00	Aditya	CASH	paid	\N	2026-05-25 10:14:41.795+00	2026-05-25 10:16:15.011+00
17	\N	Ibu early	081293450048	\N	delivery	Kantor mandiri Taspen 	completed	15000.00	0.00	0.00	15000.00	Aditya	DELIVERY_CASH	paid	\N	2026-05-25 09:51:05.558+00	2026-05-26 01:51:59.955+00
16	\N	Loli	525456688552	\N	delivery	Jln jendral sudirman	completed	24000.00	0.00	0.00	24000.00	Aditya	CASH	paid	\N	2026-05-25 09:34:51.477+00	2026-05-25 09:35:23.804+00
15	1	nadin	081219593234	less sugar	delivery	jln. baru, gang amanah	completed	48000.00	0.00	0.00	48000.00	Aditya	DELIVERY_CASH	paid	\N	2026-05-25 02:05:32.876+00	2026-05-25 02:05:59.194+00
14	1	nana	082229132624	\N	delivery	jalan. nenas no 1	completed	30000.00	0.00	5000.00	35000.00	Aditya	DELIVERY_CASH	paid	\N	2026-05-25 01:59:41.31+00	2026-05-25 02:00:50.707+00
13	1	cz	\N	\N	dine_in	\N	completed	162000.00	0.00	5000.00	167000.00	\N	DELIVERY_CASH	paid	\N	2026-05-24 03:28:49.463+00	2026-05-24 03:29:47.413+00
12	1	Doni	0854425664	\N	dine_in	\N	completed	32000.00	0.00	5000.00	37000.00	\N	DELIVERY_CASH	paid	\N	2026-05-23 02:01:32.473+00	2026-05-23 02:02:46.348+00
11	1	Erick	081237582544	\N	dine_in	\N	completed	49000.00	0.00	5000.00	54000.00	\N	DELIVERY_CASH	paid	\N	2026-05-23 00:01:59.274+00	2026-05-23 00:02:16.802+00
10	1	Test 2	081237582544	\N	dine_in	\N	completed	25000.00	2500.00	1250.00	28750.00	\N	DELIVERY_CASH	paid	\N	2026-05-22 17:27:56.819+00	2026-05-22 17:28:23.995+00
9	1	Anderson 	\N	toast ayam extra pedas, toast tuna tanpa tomat, caramel machiato less sugar.	dine_in	\N	completed	110000.00	11000.00	5500.00	126500.00	\N	CASH	paid	\N	2026-05-22 14:12:28.4+00	2026-05-22 17:28:25.899+00
8	1	andreas	\N	toast ayam extra saus sambal ya	dine_in	\N	completed	91000.00	9100.00	4550.00	104650.00	\N	CASH	paid	\N	2026-05-22 14:08:45.745+00	2026-05-22 17:28:28.11+00
7	1	adit	\N	\N	dine_in	\N	completed	25000.00	2500.00	1250.00	28750.00	\N	CASH	paid	\N	2026-05-22 13:20:15.053+00	2026-05-22 13:21:24.599+00
6	1	TEST	\N	\N	dine_in	\N	completed	59000.00	5900.00	2950.00	67850.00	\N	CASH	paid	\N	2026-05-22 13:14:47.147+00	2026-05-22 13:40:14.044+00
5	1	Erick	\N	\N	dine_in	\N	completed	24000.00	2400.00	1200.00	27600.00	\N	CASH	paid	\N	2026-05-18 00:46:09.638+00	2026-05-22 13:40:15.23+00
3	2	Ahmad Fauzi	\N	\N	dine_in	\N	completed	22000.00	2200.00	1100.00	25300.00	\N	Cash	unpaid	15	2026-05-18 00:18:32.764+00	2026-05-22 13:40:28.054+00
2	5	Sari Dewi	\N	Less sweet please	dine_in	\N	completed	24000.00	2400.00	1200.00	27600.00	\N	GoPay	paid	20	2026-05-18 00:18:32.764+00	2026-05-22 13:40:26.024+00
4	7	Linda Kusuma	\N	Extra crispy	dine_in	\N	completed	27000.00	2700.00	1350.00	31050.00	\N	\N	unpaid	\N	2026-05-18 00:18:32.764+00	2026-05-22 13:40:17.699+00
1	3	Budi Santoso	\N	\N	dine_in	\N	completed	37000.00	3700.00	1850.00	42550.00	\N	QRIS	paid	15	2026-05-18 00:18:32.764+00	2026-05-18 00:18:32.764+00
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, order_id, method, amount, status, reference_code, created_at) FROM stdin;
\.


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tables (id, table_number, qr_code, label) FROM stdin;
1	1	/menu?table=1	Table 1
2	2	/menu?table=2	Table 2
3	3	/menu?table=3	Table 3
4	4	/menu?table=4	Table 4
5	5	/menu?table=5	Table 5
6	6	/menu?table=6	Table 6
7	7	/menu?table=7	Table 7
8	8	/menu?table=8	Table 8
9	9	/menu?table=9	Table 9
10	10	/menu?table=10	Table 10
\.


--
-- Name: admin_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_accounts_id_seq', 5, true);


--
-- Name: cashiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cashiers_id_seq', 2, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 3, true);


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 33, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 58, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 21, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: tables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tables_id_seq', 10, true);


--
-- Name: admin_accounts admin_accounts_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_email_unique UNIQUE (email);


--
-- Name: admin_accounts admin_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_pkey PRIMARY KEY (id);


--
-- Name: admin_accounts admin_accounts_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_username_unique UNIQUE (username);


--
-- Name: cashiers cashiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cashiers
    ADD CONSTRAINT cashiers_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: tables tables_table_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_table_number_unique UNIQUE (table_number);


--
-- Name: menu_items menu_items_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_menu_item_id_menu_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_menu_items_id_fk FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE RESTRICT;


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: payments payments_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 7iw2ZqZTjbDEqkFXIyNkqIf82bjC4jQiHiMLhQ94hhexP6ljJgHu8ieDdbBfrAw

