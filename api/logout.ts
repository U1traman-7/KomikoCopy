const logout = async () => {
  return new Response(
    JSON.stringify({ code: 1, message: "Logged out" }),
    {
      status: 200,
      headers: {
        "Set-Cookie": "next-auth.session-token=; HttpOnly; Path=/; Max-Age=0"
      }
    },
  );
};


export { logout as GET};
