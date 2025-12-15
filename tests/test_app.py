from fastapi.testclient import TestClient
from src.app import app
from urllib.parse import quote

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # a known activity from the in-memory DB
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Math Club"
    email = "test.student@mergington.edu"

    # ensure clean state: remove if already present
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants = resp.json()[activity]["participants"]
    if email in participants:
        client.delete(f"/activities/{quote(activity)}/participants?email={quote(email)}")

    # sign up
    resp = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert resp.status_code == 200
    assert f"Signed up {email}" in resp.json().get("message", "")

    # verify present
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # unregister
    resp = client.delete(f"/activities/{quote(activity)}/participants?email={quote(email)}")
    assert resp.status_code == 200
    assert f"Unregistered {email}" in resp.json().get("message", "")

    # verify removed
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]
