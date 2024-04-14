db.createUser(
    {
        user: "mietech",
        pwd: "12302020",
        roles: [
            {
                role: "readWrite",
                db: "directory"
            }
        ]
    }
)