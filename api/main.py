import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, func, UniqueConstraint, Index, create_engine
)
from sqlalchemy import func
from sqlalchemy.orm import declarative_base, relationship, sessionmaker, selectinload
from starlette.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://clans_user:clans_pass@db:5432/clans")
API_KEY = os.getenv("API_KEY")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# root_path ensures the app works under /diablo
#ROOT_PATH = os.getenv("ROOT_PATH", "/diablo")
ROOT_PATH = os.getenv("ROOT_PATH", "")  # keep empty in dev; set /diablo in prod
app = FastAPI(title="Clans API", root_path=ROOT_PATH)

STATIC_DIR = Path("/app/static")  # absolute path inside container

if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

    # Optional SPA fallback for client routing
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        @app.get("/{full_path:path}")
        def spa_fallback(full_path: str):
            return FileResponse(str(index_path))

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-API-Key"],
)

def require_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    if not API_KEY:
        raise HTTPException(500, "Server misconfigured: API_KEY not set")
    if x_api_key != API_KEY:
        raise HTTPException(401, "Invalid API key")
    return True

class Clan(Base):
    __tablename__ = "clans"
    id = Column(Integer, primary_key=True)
    id_str = Column(String(128), nullable=False, unique=True)
    name = Column(String(200), nullable=False)
    rank = Column(Integer, nullable=False, default=0)
    immortal_rank = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    members = relationship("Member", back_populates="clan", cascade="all, delete-orphan")
    __table_args__ = (Index("ix_clans_id_str", "id_str"),)

class Member(Base):
    __tablename__ = "members"
    id = Column(Integer, primary_key=True)
    clan_id = Column(Integer, ForeignKey("clans.id", ondelete="CASCADE"), nullable=False)
    id_str = Column(String(128), nullable=False)
    name = Column(String(200), nullable=False)
    class_name = Column(String(40), nullable=False)
    hp = Column(Integer, nullable=False, default=0)
    maxhp = Column(Integer, nullable=False, default=0)
    armor_penetration = Column(Integer, nullable=False, default=0)
    armor = Column(Integer, nullable=False, default=0)
    potency = Column(Integer, nullable=False, default=0)
    resistance = Column(Integer, nullable=False, default=0)
    damage = Column(Integer, nullable=False, default=0)
    resonance = Column(Integer, nullable=False, default=0)
    clan = relationship("Clan", back_populates="members")
    __table_args__ = (
        UniqueConstraint("clan_id", "id_str", name="uq_member_clan_memberid"),
        Index("ix_members_clan_id", "clan_id"),
    )

ALLOWED_CLASSES = {
    "Sorcerer","Barbarian","Crusader","Monk","Necromancer",
    "Demon Hunter","Vampire","Tempest","Druid"}

class MemberIn(BaseModel):
    id: str
    name: str
    class_: str = Field(..., alias="class")
    hp: int; maxhp: int
    armor_penetration: int; armor: int
    potency: int; resistance: int
    damage: int; resonance: int
    @validator("class_")
    def validate_class(cls, v):
        if v not in ALLOWED_CLASSES:
            raise ValueError(f"class must be one of {sorted(ALLOWED_CLASSES)}")
        return "Demon Hunter" if v == "Demon Huner" else v

class ClanUpsertIn(BaseModel):
    id: str; name: str; rank: int
    immortalRank: int = Field(..., ge=0, le=3)
    members: List[MemberIn] = []

class ClanOut(BaseModel):
    id: str; name: str; rank: int; immortalRank: int
    updated_at: Optional[str]
    members: List[dict]

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/api/clan", response_model=ClanOut)
def get_clan(id: str):
    with SessionLocal() as s:
        clan = s.query(Clan).filter(Clan.id_str == id).first()
        if not clan: raise HTTPException(404, "Clan not found")
        return {
            "id": clan.id_str, "name": clan.name, "rank": clan.rank,
            "immortalRank": clan.immortal_rank,
            "updated_at": clan.updated_at.isoformat() if clan.updated_at else None,
            "members": [{
                "id": m.id_str, "name": m.name, "class": m.class_name,
                "hp": m.hp, "maxhp": m.maxhp, "armor_penetration": m.armor_penetration,
                "armor": m.armor, "potency": m.potency, "resistance": m.resistance,
                "damage": m.damage, "resonance": m.resonance
            } for m in clan.members],
        }

def _clan_out(c: Clan, include_members: bool = True):
    from zoneinfo import ZoneInfo
    kyiv = ZoneInfo("Europe/Kyiv")
    out = {
        "id": c.id_str,
        "name": c.name,
        "rank": c.rank,
        "immortalRank": c.immortal_rank,
        "updated_at": c.updated_at.astimezone(kyiv).isoformat() if c.updated_at else None,
    }
    if include_members:
        out["members"] = [
            {
                "id": m.id_str,
                "name": m.name,
                "class": m.class_name,
                "hp": m.hp,
                "maxhp": m.maxhp,
                "armor_penetration": m.armor_penetration,
                "armor": m.armor,
                "potency": m.potency,
                "resistance": m.resistance,
                "damage": m.damage,
                "resonance": m.resonance,
            }
            for m in c.members
        ]
    return out        

@app.get("/api/clans")
def list_clans():
    with SessionLocal() as s:
        rows = s.query(Clan).options(selectinload(Clan.members)).all()  
        return [_clan_out(c) for c in rows]     
        #return [{"id": c.id_str, "name": c.name, "rank": c.rank, "immortalRank": c.immortal_rank} for c in rows]

@app.post("/api/clans/upsert", response_model=ClanOut, dependencies=[Depends(require_api_key)])
def upsert_clan(payload: ClanUpsertIn):
    with SessionLocal() as s:
        clan = s.query(Clan).filter(Clan.id_str == payload.id).first()
        if not clan:
            clan = Clan(id_str=payload.id); s.add(clan)
        clan.name = payload.name; clan.rank = payload.rank; clan.immortal_rank = payload.immortalRank

        existing = {m.id_str: m for m in clan.members}
        incoming_ids = {m.id for m in payload.members}
        for mid, m in list(existing.items()):
            if mid not in incoming_ids: s.delete(m)
        for mi in payload.members:
            m = existing.get(mi.id)
            if not m:
                m = Member(clan=clan, id_str=mi.id); s.add(m)
            m.name = mi.name; m.class_name = mi.class_
            m.hp = mi.hp; m.maxhp = mi.maxhp
            m.armor_penetration = mi.armor_penetration; m.armor = mi.armor
            m.potency = mi.potency; m.resistance = mi.resistance
            m.damage = mi.damage; m.resonance = mi.resonance
        clan.updated_at = func.now()
        s.commit(); s.refresh(clan)
        return get_clan(clan.id_str)

# SPA fallback for client-side routes
@app.middleware("http")
async def spa_fallback(request: Request, call_next):
    resp = await call_next(request)
    if resp.status_code == 404 and not request.url.path.startswith(("/api", "/docs", "/openapi.json")):
        return FileResponse("static/index.html")
    return resp
