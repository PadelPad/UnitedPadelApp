# elo_update
HTTP POST function to finalize and rate a match.

**Request**
```json
{ "match_id": "uuid" }
```

**Response**
```json
{ "match_id":"uuid", "team1_delta": 18, "team2_delta": -18, "k_factor": 16, "margin_multiplier": 1.2 }
```
