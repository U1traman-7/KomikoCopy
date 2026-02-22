import os
import resend
import pandas as pd

resend.api_key = "re_9Rv4YMZE_4W4ahgXHnfEnGdFzeJoA13RQ"


# Load the CSV file
# file_path = 'preparation/test_users.csv'
# file_path = 'preparation/User_rows (2).csv'
file_path = "preparation/cpp.csv"
data = pd.read_csv(file_path)

# Select the 'name' and 'email' columns
selected_columns = data[["name", "email"]]
for index, row in selected_columns.iterrows():
    # if index < 37:
    #     continue
    username = row["name"]
    email = row["email"]
    if pd.isna(username):
        continue
    params: resend.Emails.SendParams = {
        "sender": "KomikoAI<cpp@komiko.app>",
        "to": [email],
        "subject": "Welcome to the KomikoAI Creative Partner Program 🎉",
        "html": f"""<!doctype html>
<html>
<head>
<meta charset='UTF-8'><meta name='viewport' content='width=device-width initial-scale=1'>
<title></title>
</head>
<body><p><strong>Hi {username if username else 'KomikoAI creator'},</strong></p>
<p>Congratulations — you’ve been selected as one of KomikoAI’s official <strong>Creative Partners</strong>!</p>
<p>We’ve already added <strong>10,000 Zaps</strong> to your account, and you’ll continue to receive <strong>10,000 free Zaps every month</strong>.</p>
<p>👉 Join our private Discord channel for creative partners: <a href='https://discord.gg/ZyXeGnqFHz' target='_blank' class='url'>https://discord.gg/ZyXeGnqFHz</a></p>
<p>Once you’re in, ping <strong>@Sophia</strong> to get your exclusive <strong>CPP identity badge</strong>. You’ll get early access to our newest AI features and connect with other top creators.</p>
<p>Note: If you don’t see the Zaps in your account, make sure you’ve registered on <a href='https://komiko.app/'>komiko.app</a> and sent us the correct email. Reply to this email if there’s any issue.</p>
<hr />
<p><strong>As a Creative Partner, here’s how you can stay active:</strong></p>
<ul>
<li>Add <strong>KomikoAI CPP</strong> to your social media bio.</li>
<li>Post your creations using <strong>#KomikoAI</strong> or <strong>@KomikoAI</strong>.</li>
<li>Email us the link to your latest post about KomikoAI each month at <strong>cpp@komiko.app</strong> to keep your perks.</li>

</ul>
<hr />
<p>We’re also launching <strong>AniShort</strong> soon — a new mobile app where creators can publish and monetize short-form AI animation series.</p>
<p>Want to be part of it? Join the AniShort Discord to stay updated: <a href='https://discord.gg/S2ap7xcTXa' target='_blank' class='url'>https://discord.gg/S2ap7xcTXa</a></p>
<p>Can’t wait to see what you’ll create 💫</p>
<p>Best,<br>Sophia<br>Founder, KomikoAI</p>
</body>
</html>""",
        #   "html": "<strong>hello, world!</strong>",
        "reply_to": "cpp@komiko.app",
        "headers": {"X-Entity-Ref-ID": "123456789"},
    }

    try:
        email = resend.Emails.send(params)
        print(f"邮件已成功发送给 {username} ({email})")
    except Exception as e:
        print(f"发送邮件给 {username} 时出错: {str(e)}")
        # 可选：打印响应内容以便调试
        try:
            print(f"响应内容: {email}")  # 如果能访问到响应对象
        except:
            pass
        continue  # 继续处理下一个收件人
