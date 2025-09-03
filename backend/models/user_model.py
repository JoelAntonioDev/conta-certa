from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from utils.db import Base

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    nif = Column(String(20), nullable=False, unique=True)
    validade_licenca = Column(String(20), nullable=False)

    usuarios = relationship("User", back_populates="empresa")
    reconciliacoes = relationship("ReconciliacaoFiscal", back_populates="empresa")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    empresa = relationship("Empresa", back_populates="usuarios")


class ReconciliacaoFiscal(Base):
    __tablename__ = "reconciliacoes_fiscais"

    id = Column(Integer, primary_key=True, index=True)
    periodo = Column(String(50), nullable=False)

    fornecedores_path = Column(String(255), nullable=False)
    retencao_path = Column(String(255), nullable=False)

    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    empresa = relationship("Empresa", back_populates="reconciliacoes")

class MovimentacaoBAI(Base):
    __tablename__ = "movimentacoes_bai"

    id = Column(Integer, primary_key=True, index=True)
    data_mov = Column(String(20))
    data_valor = Column(String(20))
    descritivo = Column(String(255))
    debito = Column(String(50))
    credito = Column(String(50))
    saldo = Column(String(50))

    criado_em = Column(DateTime(timezone=True), server_default=func.now())

class MovimentacaoContabilidade(Base):
    __tablename__ = "movimentacoes_contabilidade"
    
    id = Column(Integer, primary_key=True, index=True)
    data_mov = Column(String(40))
    data_valor = Column(String(40))
    numero_operacao = Column(String(40))
    descritivo = Column(String(70))
    debito = Column(Float)
    credito = Column(Float)
    saldo = Column(Float)
