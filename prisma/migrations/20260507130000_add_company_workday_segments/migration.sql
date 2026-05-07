ALTER TABLE companies
ADD COLUMN workday_start_minutes INTEGER,
ADD COLUMN morning_end_minutes INTEGER,
ADD COLUMN afternoon_start_minutes INTEGER,
ADD COLUMN workday_end_minutes INTEGER;

UPDATE companies
SET
    workday_start_minutes = 540,
    morning_end_minutes = 780,
    afternoon_start_minutes = 840,
    workday_end_minutes = 1080
WHERE workday_start_minutes IS NULL
   OR morning_end_minutes IS NULL
   OR afternoon_start_minutes IS NULL
   OR workday_end_minutes IS NULL;

ALTER TABLE companies
ADD CONSTRAINT companies_workday_segments_valid CHECK (
    workday_start_minutes >= 0 AND
    morning_end_minutes > workday_start_minutes AND
    afternoon_start_minutes >= morning_end_minutes AND
    workday_end_minutes > afternoon_start_minutes AND
    workday_end_minutes <= 1440
);
