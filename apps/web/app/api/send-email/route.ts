import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, name } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      )
    }

    if (!process.env.EMAIL_FROM || !process.env.PASS) {
      return NextResponse.json(
        { error: 'Email configuration missing' },
        { status: 500 }
      )
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.PASS
      }
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"Mercor Time Tracker" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: subject,
      html: html
    })

    console.log('Email sent successfully:', info.messageId)
    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId 
    })

  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}