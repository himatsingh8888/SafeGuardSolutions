import bcrypt from 'bcrypt'
import pool from '../db/db.js'
import jwt from 'jsonwebtoken'
import dotenv from "dotenv";


export async function loginUser(req, res){
    dotenv.config()
    const { username, password } = req.body
    const trimmedUsername = username.trim()

    try{
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [trimmedUsername])
        const user = result.rows[0]

        if(!user){
            return res.status(401).json({message: 'invalid credentials'})
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if(!passwordMatch){
            return res.status(401).json({message: 'wrong password'})
        }else{
            const token = jwt.sign({id: user.id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "1h"})


            return res.json({token: token, role: user.role})
        }





    }catch(err){
        console.log({error: 'database error'})
    }
}