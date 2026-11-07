"use client";
import { useActionState, useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { removeAvatar, updateStudentProfile, uploadAvatar, type PortalActionState } from "@/app/dashboard/actions";
import { btnSmDark, btnSmOutline, portalCard, portalInput } from "@/components/dashboard/portal-ui";
import { Art } from "@/components/home/redesign/illustrations";

const initial = {};
const AVATAR_SIZE = 256;

export function SettingsForm({ name, avatarUrl }: { name: string; avatarUrl: string }) {
  const [state, action, pending] = useActionState(updateStudentProfile, initial);
  return <div className={`${portalCard} space-y-5 p-5 sm:p-6`}>
    <h2 className="font-sans text-lg font-semibold tracking-normal">Профайл</h2>
    <AvatarPicker initialUrl={avatarUrl}/>
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium">Бүтэн нэр<input name="fullName" defaultValue={name} required className={`${portalInput} mt-2`}/></label>
      <Message state={state}/>
      <button type="submit" disabled={pending} aria-busy={pending} className={`${btnSmDark} h-11`}>{pending ? "Хадгалж байна…" : "Өөрчлөлт хадгалах"}</button>
    </form>
  </div>;
}

function AvatarPicker({ initialUrl }: { initialUrl: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [state, setState] = useState<PortalActionState>({});
  const [pending, startTransition] = useTransition();

  const choose = (file: File | undefined) => {
    if (!file) return;
    setState({});
    startTransition(async () => {
      let image: Blob;
      try { image = await squareImage(file); }
      catch { setState({ error: "Энэ зургийг уншиж чадсангүй. JPG эсвэл PNG зураг сонгоно уу." }); return; }
      const form = new FormData();
      form.append("avatar", new File([image], `avatar.${image.type === "image/webp" ? "webp" : "jpg"}`, { type: image.type }));
      const result = await uploadAvatar(form);
      setState(result);
      if (result.url) setUrl(result.url);
    });
    if (input.current) input.current.value = "";
  };

  const clear = () => startTransition(async () => {
    const result = await removeAvatar();
    setState(result);
    if (!result.error) setUrl("");
  });

  return <div>
    <div className="flex flex-wrap items-center gap-4">
      {url
        ? <span role="img" aria-label="Профайл зураг" className="h-20 w-20 shrink-0 rounded-[26px] bg-[#F1F3F8] bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(url)})` }}/>
        : <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[26px] bg-[#FFE4EF]"><Art name="friend-coral" size={80}/></span>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={pending} className={btnSmDark}><Camera size={16}/>{pending ? "Хадгалж байна…" : url ? "Зураг солих" : "Зураг оруулах"}</button>
        {url && <button type="button" onClick={clear} disabled={pending} className={btnSmOutline}><Trash2 size={16}/>Устгах</button>}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => choose(event.target.files?.[0])}/>
    </div>
    <div className="mt-3"><Message state={state}/></div>
  </div>;
}

/** Center-crops the photo to a square and scales it down, so uploads stay small (~20–40 KB). */
async function squareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  // Older Safari cannot encode WebP and silently returns PNG; fall back to JPEG there.
  const webp = await encode("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg");
  if (!jpeg) throw new Error("Encoding failed");
  return jpeg;
}

function Message({ state }: { state: PortalActionState }) { return state.error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : state.success ? <p role="status" className="rounded-xl bg-[#E9FBF2] p-3 text-sm text-[#15803D]">{state.success}</p> : null; }
