import { useEffect, useState } from "react";
import { api } from "../services/api";
type Cargo = { id:number; nome:string; area:string; descricao:string; altaDemanda:boolean; salarioMedio:string };
export function CarreirasPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  useEffect(() => { api.get<Cargo[]>("/cargos").then(r => setCargos(r.data)).catch(() => setCargos([])); }, []);
  return <section className="page"><span className="eyebrow">CARREIRAS</span><h1>Explore profissões</h1>
    <div className="grid">{cargos.map(cargo => <article className="card" key={cargo.id}><span>{cargo.area}</span><h2>{cargo.nome}</h2><p>{cargo.descricao}</p>{cargo.altaDemanda && <strong>↑ Alta demanda</strong>}</article>)}</div>
  </section>;
}