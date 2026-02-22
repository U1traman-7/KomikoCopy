import os
import time
import resend
import pandas as pd
from supabase import create_client, Client
from concurrent.futures import ThreadPoolExecutor, as_completed

# Set your Resend API key
resend.api_key = "re_9Rv4YMZE_4W4ahgXHnfEnGdFzeJoA13RQ"

# Supabase configuration
supabase_url = "https://dihulvhqvmoxyhkxovko.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaHVsdmhxdm1veHloa3hvdmtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMDM5MjY3MCwiZXhwIjoyMDM1OTY4NjcwfQ.xmb_dy0CRizmi7gipLp78-PlAF3GRa9UdROhHtlE0Sw"
supabase: Client = create_client(supabase_url, supabase_key)


# Fetch users from Supabase
def fetch_all_users():
    max_users = 50000 # TODO: Maximum number of users to fetch and send email
    offset = 0 # TODO: initial offset is 0 
    all_users = []
    batch_size = 1000

    while True:
        # Calculate remaining users to fetch
        remaining_users = max_users - len(all_users)
        if remaining_users <= 0:
            print(f"Reached max_users limit of {max_users}")
            break
        
        # Adjust batch size if we're near the limit
        current_batch_size = min(batch_size, remaining_users)
        
        response = (
            supabase.table("User")
            .select("name, email")
            .eq("email", "team@caffelabs.com") # TODO: test email
            .eq("unsubscribe", False)
            .order("created_at", desc=True)
            .range(offset, offset + current_batch_size - 1)
            .execute()
        )
        batch = response.data
        if not batch:
            break
        all_users.extend(batch)
        print(f"Fetched {len(batch)} users (Total: {len(all_users)})")
        offset += batch_size

    return all_users


# Send single email
def send_email(member):
    username = member.get("name") or "KomikoAI Fam"
    email = member.get("email")

    if not email or pd.isna(email):
        print(f"⚠️ Skipping member with no email: {username}")
        return

    params: resend.Emails.SendParams = {
        "sender": "KomikoAI <contact@komiko.app>",
        "to": [email],
        "subject": "80+ Viral Video Styles — Now Live on ProductHunt!", # TODO: change subject
        "html": open("preparation/Support Us on ProductHunt.html").read()\
            .replace("{username}", username if username else 'KomikoAI Fam')\
            .replace("{email}", email), #TODO: change html file, remember to include unsubscribe link and use Dear {username},
        "reply_to": "contact@komiko.app",
        "headers": {"X-Entity-Ref-ID": "123456789"},
    }

    try:
        resend.Emails.send(params)
        print(f"✅ Sent to {username} ({email})")
    except Exception as e:
        print(f"❌ Failed to send to {username} ({email}): {str(e)}")


# Send in batches of 10
def send_in_parallel_batches(users, batch_size=10, delay=1):
    total_sent = 0

    for i in range(0, len(users), batch_size):
        batch = users[i : i + batch_size]

        with ThreadPoolExecutor(max_workers=batch_size) as executor:
            futures = [executor.submit(send_email, user) for user in batch]
            for future in as_completed(futures):
                future.result()

        total_sent += len(batch)
        print(
            f"✅ Sent {len(batch)} users in this batch. Total sent so far: {total_sent} users"
        )
        print(f"⏳ Waiting {delay}s before next batch...\n")
        time.sleep(delay)


# Main
if __name__ == "__main__":
    all_users = fetch_all_users()
    send_in_parallel_batches(all_users, batch_size=10, delay=1)
