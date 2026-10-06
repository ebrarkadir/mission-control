DELETE FROM notifications;

ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_alert_id_key;

ALTER TABLE notifications
    ADD COLUMN user_id BIGINT NOT NULL;

ALTER TABLE notifications
    ADD CONSTRAINT uq_notifications_user_alert
    UNIQUE (user_id, alert_id);

CREATE INDEX idx_notifications_user_created_at
    ON notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_user_read
    ON notifications (user_id, is_read);