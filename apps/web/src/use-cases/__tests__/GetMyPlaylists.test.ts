import { GetMyPlaylistsUseCase } from '../GetMyPlaylists';
import type { IPlaylistRepository } from '../../domain/repositories/PlaylistRepository';

describe('GetMyPlaylistsUseCase (실패 케이스)', () => {
  it('리포지토리에서 예외가 나면 ok: false, error 반환', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw new Error('DB connection failed');
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('DB connection failed');
  });

  it('리포지토리가 문자열을 throw하면 error에 그 내용 반환', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw 'something wrong';
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('something wrong');
  });

  it('리포지토리가 Symbol을 throw하면 error에 String 변환값', async () => {
    const sym = Symbol('err');
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw sym;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(String(sym));
  });

  it('리포지토리 findAll이 null을 throw하면 ok: false', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw null;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('null');
  });

  it('리포지토리 findAll이 reject하면 ok: false', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(new Error('Network error')),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Network error');
  });

  it('리포지토리 findAll이 reject(문자열)하면 error에 그 내용', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject('rejected string'),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('rejected string');
  });

  it('리포지토리 findAll이 reject(null)하면 ok: false', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(null),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('null');
  });

  it('리포지토리 findAll이 reject(undefined)하면 ok: false', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(undefined),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('undefined');
  });

  it('리포지토리 findAll이 reject(Symbol)하면 error에 String 변환', async () => {
    const sym = Symbol('reject');
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(sym),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(String(sym));
  });

  it('리포지토리 findAll이 빈 메시지 Error를 throw하면 ok: false', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw new Error('');
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('');
  });

  it('리포지토리 findAll이 reject(BigInt)하면 error에 String 변환', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(BigInt(42)),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('42');
  });

  it('리포지토리가 일반 객체를 throw하면 error에 [object Object]', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw { code: 'ERR_CUSTOM' };
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('[object Object]');
  });

  it('리포지토리 findAll이 reject(Error)인데 message가 숫자면 error에 문자열', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(new Error(123 as unknown as string)),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('123');
  });

  it('리포지토리 findAll이 reject(일반 객체)하면 error에 [object Object]', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject({ err: true }),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('[object Object]');
  });

  it('리포지토리 findAll이 reject(배열)하면 error에 문자열 변환', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject([1, 2, 3]),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('1,2,3');
  });

  it('리포지토리 findAll이 reject(Date)하면 error에 ISO 문자열', async () => {
    const d = new Date('2020-01-01');
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(d),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(d.toString());
  });

  it('리포지토리 findAll이 reject(RegExp)하면 error에 String 변환', async () => {
    const re = /test/g;
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(re),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(String(re));
  });

  it('리포지토리 findAll이 reject(BigInt(0))하면 error에 0', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(BigInt(0)),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('0');
  });

  it('리포지토리가 Error(undefined)를 throw하면 ok: false', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw new Error(undefined as unknown as string);
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(typeof result.error).toBe('string');
  });

  it('리포지토리 findAll이 reject(Error) message가 빈 객체면 error에 [object Object]', async () => {
    const err = new Error({} as unknown as string);
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(err),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('[object Object]');
  });

  it('리포지토리 findAll이 reject(0)하면 error에 0', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(0),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('0');
  });

  it('리포지토리 findAll이 reject(false)하면 error에 false', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(false),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('false');
  });

  it('리포지토리 findAll이 reject(NaN)하면 error에 NaN', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(NaN),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NaN');
  });

  it('리포지토리가 숫자 500을 throw하면 error에 500', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw 500;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('500');
  });

  it('리포지토리 findAll이 reject(Infinity)하면 error에 Infinity', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(Infinity),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Infinity');
  });

  it('리포지토리 findAll이 reject(true)하면 error에 true', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(true),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('true');
  });

  it('리포지토리가 boolean true를 throw하면 error에 true', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw true;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('true');
  });

  it('리포지토리 findAll이 reject(-1)하면 error에 -1', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(-1),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('-1');
  });

  it('리포지토리가 undefined를 throw하면 ok: false', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw undefined;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('undefined');
  });

  it('리포지토리 findAll이 reject(Error) message가 배열이면 error에 1,2,3', async () => {
    const err = new Error([1, 2, 3] as unknown as string);
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(err),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('1,2,3');
  });

  it('리포지토리가 boolean false를 throw하면 error에 false', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw false;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('false');
  });

  it('리포지토리가 RegExp를 throw하면 error에 String 변환', async () => {
    const re = /test/gi;
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw re;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(String(re));
  });

  it('리포지토리 findAll이 reject(Map)하면 error에 [object Map]', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(new Map()),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('[object Map]');
  });

  it('리포지토리 findAll이 reject(Set)하면 error에 [object Set]', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(new Set()),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('[object Set]');
  });

  it('리포지토리 findAll이 reject(ArrayBuffer)하면 error에 [object ArrayBuffer]', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(new ArrayBuffer(0)),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('[object ArrayBuffer]');
  });

  it('리포지토리가 3.14를 throw하면 error에 3.14', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw 3.14;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('3.14');
  });

  it('리포지토리 findAll이 reject(DataView)하면 error에 [object DataView]', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(new DataView(new ArrayBuffer(0))),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('[object DataView]');
  });

  it('리포지토리 findAll이 reject(함수)하면 ok: false, error에 함수 문자열', async () => {
    const fn = () => {};
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(fn),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(String(fn));
  });

  it('리포지토리가 -0을 throw하면 error에 0', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw -0;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('0');
  });

  it('리포지토리 findAll이 reject(RegExp)하면 error에 String 변환', async () => {
    const re = /ab+c/g;
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(re),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(String(re));
  });

  it('리포지토리가 1e2를 throw하면 error에 100', async () => {
    const throwingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: async () => {
        throw 1e2;
      },
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(throwingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('100');
  });

  it('리포지토리 findAll이 reject(Promise)하면 error에 [object Promise]', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject(Promise.resolve()),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('[object Promise]');
  });

  it('리포지토리 findAll이 reject(빈 배열)하면 error에 빈 문자열', async () => {
    const rejectingRepo: IPlaylistRepository = {
      save: async () => {},
      findAll: () => Promise.reject([]),
      clear: async () => {},
    };
    const useCase = new GetMyPlaylistsUseCase(rejectingRepo);
    const result = await useCase.run();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('');
  });
});
