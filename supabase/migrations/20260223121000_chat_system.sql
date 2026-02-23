
-- Chat System Schema

-- Enums
DO $$ BEGIN
    CREATE TYPE conversation_type AS ENUM ('direct', 'group', 'hr_support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type conversation_type NOT NULL DEFAULT 'direct',
    title TEXT, -- Optional for direct, required for group
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation Members
CREATE TABLE IF NOT EXISTS conversation_members (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'admin', 'member'
    joined_at TIMESTAMPTZ DEFAULT now(),
    last_read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, employee_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- 'text', 'attachment', 'system'
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check conversation membership without recursion
CREATE OR REPLACE FUNCTION check_chat_membership(conv_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_members
        WHERE conversation_id = conv_id
        AND employee_id IN (
            SELECT id FROM employees WHERE user_id = u_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (check_chat_membership(id, auth.uid()));

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for conversation_members
CREATE POLICY "Users can view members of their conversations" ON conversation_members
    FOR SELECT USING (check_chat_membership(conversation_id, auth.uid()));

CREATE POLICY "Users can insert conversation members" ON conversation_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own membership" ON conversation_members
    FOR UPDATE USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (check_chat_membership(conversation_id, auth.uid()));

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (check_chat_membership(conversation_id, auth.uid()));

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Realtime Configuration
-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Functions
-- Function to update conversation's updated_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
CREATE TRIGGER on_new_message_update_chat
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- RPC to find existing direct conversation between two employees
CREATE OR REPLACE FUNCTION find_direct_conversation(user_a UUID, user_b UUID)
RETURNS UUID AS $$
DECLARE
    conv_id UUID;
BEGIN
    SELECT cm1.conversation_id INTO conv_id
    FROM conversation_members cm1
    JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    JOIN conversations c ON c.id = cm1.conversation_id
    WHERE c.type = 'direct'
    AND cm1.employee_id = user_a
    AND cm2.employee_id = user_b
    LIMIT 1;
    
    RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
