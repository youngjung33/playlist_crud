import { NextResponse } from 'next/server';
import { GetMyPlaylistsUseCase } from '../../../use-cases/GetMyPlaylists';
import { FilePlaylistRepository } from '../../../adapters/FilePlaylistRepository';

export async function GET() {
  const repo = new FilePlaylistRepository();
  const useCase = new GetMyPlaylistsUseCase(repo);
  const result = await useCase.run();

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const playlists = result.playlists.map((p) => ({
    id: p.id,
    name: p.name,
    song_count: p.tracks.length,
  }));

  return NextResponse.json({ playlists });
}
