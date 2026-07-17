-- MatchMe Realtime Configuration
-- Enable realtime for messages and matches tables

BEGIN;

-- Enable realtime for messages (chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for matches (live match notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

COMMIT;