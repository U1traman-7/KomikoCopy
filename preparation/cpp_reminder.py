import os
import resend
import pandas as pd
from supabase import create_client, Client

resend.api_key = "re_9Rv4YMZE_4W4ahgXHnfEnGdFzeJoA13RQ"

# Supabase configuration
supabase_url = "https://dihulvhqvmoxyhkxovko.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaHVsdmhxdm1veHloa3hvdmtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMDM5MjY3MCwiZXhwIjoyMDM1OTY4NjcwfQ.xmb_dy0CRizmi7gipLp78-PlAF3GRa9UdROhHtlE0Sw"

# Initialize Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

# Fetch emails from Supabase CPP table where status=1
try:
    response = supabase.table("cpp").select("name, email").eq("status", 1).execute()
    cpp_data = response.data
    print(f"Found {len(cpp_data)} CPP members with status=1")
except Exception as e:
    print(f"Error fetching data from Supabase: {e}")
    exit(1)

# Process each CPP member
for member in cpp_data:
    username = member.get("name")
    email = member.get("email")

    if not email or pd.isna(email):
        print(f"Skipping member with no email: {username}")
        continue

    params: resend.Emails.SendParams = {
        "sender": "KomikoAI CPP <cpp@komiko.app>",
        "to": [email],
        #         "subject": "Become KomikoAI Ambassador, Earn 30% Lifetime Revenue Share!",
        #         "html": f"""<!doctype html>
        # <html>
        # <head>
        # <meta charset='UTF-8'><meta name='viewport' content='width=device-width initial-scale=1'>
        # <title></title>
        # </head>
        # <body><p>Hi {username if username else 'KomikoAI creator'},</p>
        # <p>We've got exciting news for you! 🚀</p>
        # <p>As a valued member of our <strong>Creative Partner Program (CPP)</strong>, you're now officially invited to become an <strong>Early Ambassador</strong> in the brand-new <strong>KomikoAI Ambassador Program</strong>!</p>
        # <p>This is more than just a title — as one of our early ambassadors, you'll unlock <strong>exclusive perks</strong> that won't be available to future creators, including:</p>
        # <h3 id='💸-30-lifetime-recurring-revenue-share'><strong>💸 30% Lifetime Recurring Revenue Share</strong></h3>
        # <p>That's right — for every paid user who signs up through your invite link, you'll earn <strong>30% of all their future payments, for life</strong>. This is <strong>3x</strong> the standard rate, and it's our way of saying thank you for growing with us early on.</p>
        # <h3 id='📣-your-invite-code--referral-link'><strong>📣 Your Invite Code &amp; Referral Link</strong></h3>
        # <p>After logging into your account, go to your <strong>Profile → Reward</strong> to find your personal invite code and link. Share it on social media, in videos, or with your community to start earning.</p>
        # <h3 id='🔗-need-help-or-have-questions'><strong>🔗 Need Help or Have Questions?</strong></h3>
        # <p>We're just an email away. Reach out anytime if you need help creating content, requesting more credits, or optimizing your posts.</p>
        # <p>Thanks again for being part of our journey. We can't wait to see what you'll create next 💫</p>
        # <p>Best,
        # KomikoAI Team</p>
        # </body>
        # </html>""",
        "subject": "Reminder: Share Your Creation to Stay in the KomikoAI CPP!",
        "html": f"""<!doctype html>
        <html>
        <head>
        <meta charset='UTF-8'><meta name='viewport' content='width=device-width initial-scale=1'>
        <title></title>
        </head>
        <body>
        <p>Hi {username if username else 'KomikoAI creator'},</p>
        <p>Just a friendly reminder 💌</p>
        <p>To keep your <strong>Creative Partner Program</strong> perks, don't forget to post about KomikoAI and send us the link!</p>
        <p>📩 Just reply to this email with your latest post link to stay active.</p>
        <p>Need inspiration? You could share:</p>
        <ul>
          <li>Your latest KomikoAI creation</li>
          <li>Tutorials, tips, or your favorite features</li>
          <li>Behind-the-scenes of your creative process</li>
        </ul>
        <p>Remember to include <strong>#KomikoAI</strong> or <strong>@KomikoAI</strong> in your post and keep <strong>"KomikoAI CPP"</strong> in your bio.</p>
        <p>We love seeing what you're creating and can't wait to see more!</p>
        <p>Best,<br>KomikoAI Team</p>
        </body>
        </html>""",
        #  <strong>before the end of this month</strong>
        # "html": "<strong>hello, world!</strong>",
        "reply_to": "cpp@komiko.app",
        "headers": {"X-Entity-Ref-ID": "123456789"},
    }

    try:
        email_result = resend.Emails.send(params)
        print(f"邮件已成功发送给 {username} ({email})")
    except Exception as e:
        print(f"发送邮件给 {username} 时出错:", e)
        # 可选：打印响应内容以便调试
        try:
            print(f"响应内容: {email_result}")  # 如果能访问到响应对象
        except:
            pass
        continue  # 继续处理下一个收件人
