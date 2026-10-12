# User Model Design

## Purpose
Represents users who create, update, assign, or review tickets.

## Core Fields
- id: string
- name: string
- email: string
- role: enum
- avatarUrl: string | null
- isActive: boolean
- createdAt: datetime
- updatedAt: datetime

## Role Values
- admin
- manager
- team-member
- viewer

## Schema Intent
The user model supports:
- ticket ownership and assignment
- role-based access control
- team and reporting visibility
- audit trails for ticket updates

## Relationships
- A user can create many tickets
- A user can be assigned many tickets
- A user can comment on multiple tickets

## Design Notes
The user model is intentionally simple but extensible so future features such as teams, permissions, or department mapping can be introduced without major refactoring.
