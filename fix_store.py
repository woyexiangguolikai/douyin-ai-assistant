with open("electron/store/index.ts", "r", encoding="utf-8") as f:
    content = f.read()

old = """  private seedDefaults() {
    const existing = this.db.exec("SELECT key FROM settings WHERE key = 'app_settings'")
    if (existing.length === 0 || existing[0].values.length === 0) {
      this.saveSettings(DEFAULT_SETTINGS)
    }
    const personaCount = this.db.exec("SELECT COUNT(*) as count FROM personas")
    if (personaCount.length === 0 || personaCount[0].values[0][0] === 0) {
      this.savePersona(DEFAULT_PERSONA)
    }
    const filterCount = this.db.exec("SELECT COUNT(*) as count FROM filter_rules")
    if (filterCount.length === 0 || filterCount[0].values[0][0] === 0) {
      this.saveFilterRules(DEFAULT_FILTER_RULES)
    }
  }"""

new = """  private seedDefaults() {
    const versionRows = this.db.exec("SELECT value FROM settings WHERE key = 'db_version'")
    let dbVersion = 0
    if (versionRows.length > 0 && versionRows[0].values.length > 0) {
      dbVersion = parseInt(versionRows[0].values[0][0] as string, 10) || 0
    }
    if (dbVersion < 1) {
      this.saveFilterRules(DEFAULT_FILTER_RULES)
      this.db.run("DELETE FROM personas")
      this.savePersona(DEFAULT_PERSONA)
      this.db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('db_version', '1')")
      this.save()
    }
    const existing = this.db.exec("SELECT key FROM settings WHERE key = 'app_settings'")
    if (existing.length === 0 || existing[0].values.length === 0) {
      this.saveSettings(DEFAULT_SETTINGS)
    }
  }"""

if old in content:
    content = content.replace(old, new)
    with open("electron/store/index.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("OK")
else:
    print("NOT FOUND")
