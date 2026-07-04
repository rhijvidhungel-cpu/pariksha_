"use client";

import { useParams } from "next/navigation";

export default function HallView() {
  const params = useParams();
  const roomId = params.id;

  console.log(roomId); // 1, 2, 3...

  return (
    <div>
      Room ID: {roomId}
    </div>
  );
}