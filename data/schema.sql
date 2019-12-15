DROP TABLE IF EXISTS cityLocation,
weather,
events;

CREATE TABLE IF NOT EXISTS cityLocation(
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(18, 6),
    longitude NUMERIC(18, 6),
    region VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS weather(
    searchid INT REFERENCES cityLocation(id),
    summary TEXT,
    time INTEGER
);

CREATE TABLE IF NOT EXISTS events(
    searchID INT REFERENCES cityLocation(id),
    link VARCHAR(255),
    eventName VARCHAR(255),
    eventDate DATE,
    eventDetails TEXT
);