with open("web/style.css", "r", encoding="utf-8") as f:
    css = f.read()

addon = """
/* Badges for HQ and BOB */
.badge-hq {
  background: rgba(56, 189, 248, 0.18) !important;
  color: #38bdf8 !important;
  border: 1px solid rgba(56, 189, 248, 0.35) !important;
}

.badge-bob {
  background: rgba(168, 85, 247, 0.18) !important;
  color: #c084fc !important;
  border: 1px solid rgba(168, 85, 247, 0.35) !important;
}

/* User Profile Menu & Logout Button */
.user-profile-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.user-badge {
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
  white-space: nowrap;
}

.logout-btn {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.35);
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
}

.logout-btn:hover {
  background: rgba(248, 113, 113, 0.3);
  color: #ffffff;
  border-color: #f87171;
}

@media (max-width: 640px) {
  .user-profile-menu {
    width: 100%;
    justify-content: space-between;
    padding: 6px 10px;
  }
}
"""

with open("web/style.css", "a", encoding="utf-8") as f:
    f.write(addon)

print("Updated web/style.css with badges and user menu!")
