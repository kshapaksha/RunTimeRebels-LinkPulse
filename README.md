# Run Time Rebels — Smart & Secure URL Shortener

> A lightweight URL shortener built with Python and Vanilla JavaScript, designed to make short links **safer, private, and easier to manage**.

## Overview

Short URLs are convenient, but they can also hide where a link actually leads. They usually provide very little control over who can access a link, how long it stays active, or how people are interacting with it.

**Run Time Rebels** is our solution to this problem.

We built a **Smart & Secure URL Shortener** that combines fast URL shortening with security, access control, QR generation, feedback, and useful traffic analytics — all in one simple platform.

---

## The Problem

Traditional URL shorteners are good at making links shorter, but they often miss important controls.

### What we wanted to solve

- **Unsafe links** can hide phishing or scam destinations.
- **No privacy control** means links can remain publicly accessible.
- **No expiry control** means old links may continue working forever.
- **Limited insights** make it difficult to understand link traffic.
- **No user feedback system** makes reporting bad links difficult.

We wanted to build something that is not just a URL shortener, but a **controlled and security-focused link management system**.

---

## Our Solution

Run Time Rebels gives users more control over every shortened link.

### Key Features

| Feature | What it does |
|---|---|
| **URL Shortening** | Creates short and easy-to-share links |
| **Password Protection** | Allows only users with the correct password to open protected links |
| **Link Expiry** | Automatically deactivates a link after a selected date |
| **Click Tracking** | Counts successful visits to shortened links |
| **Security Scan** | Checks URLs using Google Safe Browsing API |
| **Bad Link Blocking** | Blocks links identified as dangerous |
| **Analytics Dashboard** | Shows useful traffic information |
| **Referral Tracking** | Helps identify the source/platform bringing traffic |
| **Country Insights** | Shows traffic by country |
| **QR Code Generator** | Generates downloadable QR codes for shortened links |
| **Feedback & Reporting** | Allows visitors to report links and submit feedback |

---

## How It Works

The basic flow is simple:

```text
Create a Link
      ↓
Security & Access Checks
      ↓
Save Link Data
      ↓
Generate Short URL
      ↓
Visitor Opens Link
      ↓
Verify Password / Expiry
      ↓
Update Click Count
      ↓
Redirect to Original URL

## Deployment

LinkPulse is deployed on Render using Flask and Gunicorn. The project is hosted on GitHub, and Upstash Redis is used for persistent data storage.

The live application supports URL shortening, QR code generation, and link analytics.
