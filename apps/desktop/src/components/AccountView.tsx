import React from "react";
import { defaultAccountState, getTierDescription } from "../lib/account";

export function AccountView() {
  const account = defaultAccountState;

  return (
    <div className="surface-grid">
      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Account State</p>
        </div>

        <div className="stats-grid stats-grid--two">
          <div className="stat-box">
            <span>Tier</span>
            <strong>{account.tier}</strong>
          </div>
          <div className="stat-box">
            <span>Authenticated</span>
            <strong>{account.isAuthenticated ? "Yes" : "No"}</strong>
          </div>
          <div className="stat-box">
            <span>Sync</span>
            <strong>{account.syncEnabled ? "Enabled" : "Off"}</strong>
          </div>
          <div className="stat-box">
            <span>Devices</span>
            <strong>{account.deviceCount}</strong>
          </div>
        </div>

        <div className="panel-note">{getTierDescription(account.tier)}</div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Tier Map</p>
        </div>

        <div className="stack-sm">
          {(["guest", "free", "pro", "team"] as const).map((tier) => (
            <article key={tier} className="insight-card">
              <strong>{tier}</strong>
              <p>{getTierDescription(tier)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Actions</p>
        </div>

        <div className="stack-sm">
          <button className="btn">Sign in</button>
          <button className="btn">Manage subscription</button>
          <button className="btn">Export my data</button>
          <button className="btn btn--danger">Delete account</button>
        </div>
      </section>
    </div>
  );
}
