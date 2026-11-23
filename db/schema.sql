-- O'zbekiston ob-havo dashboard sxemasi

create table if not exists cities (
  id          serial primary key,
  slug        text unique not null,
  name        text not null,
  region      text not null,
  latitude    double precision not null,
  longitude   double precision not null,
  is_center   boolean not null default false  -- viloyat markazi
);

create table if not exists daily_weather (
  city_id         integer not null references cities(id) on delete cascade,
  date            date not null,
  weather_code    smallint,
  temp_max        real,
  temp_min        real,
  temp_mean       real,
  precipitation   real,   -- mm
  snowfall        real,   -- sm
  wind_speed_max  real,   -- km/soat
  humidity_mean   real,   -- %
  sunrise         text,   -- HH:MM
  sunset          text,   -- HH:MM
  source          text not null check (source in ('archive', 'forecast')),
  updated_at      timestamptz not null default now(),
  primary key (city_id, date)
);

create index if not exists daily_weather_date_idx on daily_weather (date);

create table if not exists current_weather (
  city_id               integer primary key references cities(id) on delete cascade,
  observed_at           timestamptz not null,
  temperature           real,
  apparent_temperature  real,
  humidity              real,
  weather_code          smallint,
  wind_speed            real,
  pressure              real,
  updated_at            timestamptz not null default now()
);

create table if not exists sync_log (
  id           serial primary key,
  kind         text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  rows         integer,
  ok           boolean,
  error        text
);
