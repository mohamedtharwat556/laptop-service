-- Create technician_ratings table
CREATE TABLE IF NOT EXISTS technician_ratings (
    id SERIAL PRIMARY KEY,
    technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_technician_ratings_technician_id ON technician_ratings(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_ratings_request_id ON technician_ratings(request_id);
CREATE INDEX IF NOT EXISTS idx_technician_ratings_rating ON technician_ratings(rating);
