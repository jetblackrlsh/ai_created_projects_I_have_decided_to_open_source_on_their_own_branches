# Artwork provenance

All 79 game illustrations were generated for this project on 2026-11-02 using the built-in `image_gen.imagegen` tool. They are AI-generated raster artwork, not hand-drawn artwork or imported third-party character assets. See [ART_LICENSE.md](ART_LICENSE.md) for the artwork terms and AI-output limitations.

## Art direction

Original adult fairy custodians with individually designed faces, costumes, wings and silhouettes. The rendering brief calls for highly saturated modern-anime illustration, sharp clean outlines, cinematic prismatic lighting, expressive poses and readable spell effects. Their domains are dragon fire, sun/moon light, plants, sound and harmony, technology, water and shapeable magical liquid, and wild animals. Seven original magical conquerors and their realms were independently designed around stolen civic freedoms. The cover depicts luminous routes linking sovereign worlds.

## Processing and mapping

Hero illustrations were generated as seven separate 3×3 atlases. Each atlas has a character portrait in cell 0 and eight distinct spell-action scenes in cells 1–8, read left-to-right then top-to-bottom. Atlas size is 1254×1254; each final PNG is an exact 418×418 crop. No redrawing, image synthesis outside the stated tool, or upscaling was used in cropping. The villain atlas uses the same 3×3 layout, cells 0–6. Realm illustrations and the hub come from a separate landscape-cell atlas. The cover is a standalone generated image, subsequently edited with the same image tool to replace its central knot motif with a natural starburst. All output files were visually inspected for mapping and major consistency defects; minor generative illustration imperfections can remain.

Source identifiers below are generation basenames, not external URLs or private filesystem paths. Crop rectangles are [left, top, right, bottom] in source pixels. Source atlases are not required at runtime. The SHA-256 hashes identify the distributed PNG files.

| Output file | Generation source | Cell / crop | SHA-256 |
|---|---|---|---|
| `assets/tavra.png` | `exec-0ec364cc-9003-4bab-b94b-632b9d7b918a.png` | 0: [0, 0, 418, 418] | `253193d5d603138be94fd9e1ddbe21a1c77a51a1ceaef41caa17705722c76506` |
| `assets/tavra-spell-1.png` | `exec-0ec364cc-9003-4bab-b94b-632b9d7b918a.png` | 1: [418, 0, 836, 418] | `2586640f149ff467fb2eac02e71115be469fab8661d36843bad605c17be2dd45` |
| `assets/tavra-spell-2.png` | `exec-0ec364cc-9003-4bab-b94b-632b9d7b918a.png` | 2: [836, 0, 1254, 418] | `30a07d2ce23ce0e9691d6965a70990b39f77f46006fe238acaae57566b031dab` |
| `assets/tavra-spell-3.png` | `exec-0ec364cc-9003-4bab-b94b-632b9d7b918a.png` | 3: [0, 418, 418, 836] | `648a668a699c562c953d3ba18a94f536f1a89c5a03cbc44ce9662539ec735411` |
| `assets/tavra-spell-4.png` | `exec-0ec364cc-9003-4bab-b94b-632b9d7b918a.png` | 4: [418, 418, 836, 836] | `74ec21a89341dc9831c7354229379083982d0a7b1066bbed0efacef15ce7ee54` |
| `assets/tavra-spell-5.png` | `exec-0ec364cc-9003-4bab-b94b-632b9d7b918a.png` | 5: [836, 418, 1254, 836] | `6e02539797d0db4be0fe9c57001f21f09ce436fb18088fa200e60aa8043e8e4b` |
| `assets/tavra-spell-6.png` | `exec-0ec364cc-9003-4bab-b94b-632b9d7b918a.png` | 6: [0, 836, 418, 1254] | `b834fe8239b790f3e8ef0e3decadb421c6c9883df0c2125458753111eea72a13` |
| `assets/tavra-spell-7.png` | `exec-0ec364cc-9003-4bab-b94b-632b9d7b918a.png` | 7: [418, 836, 836, 1254] | `7ef40ef2d3788c6363391842944405f3d6b860aba1670aa68b91430a7e44d136` |
| `assets/tavra-spell-8.png` | `exec-0ec364cc-9003-4bab-b94b-632b9d7b918a.png` | 8: [836, 836, 1254, 1254] | `f0fb4e93745d66dcc1aabd9b182fd05fae46319602c58bf114529d1d7ee68006` |
| `assets/oru.png` | `exec-b979545c-d7d1-41e1-a4dd-e5db87785c20.png` | 0: [0, 0, 418, 418] | `f89673152d41b0b50e6bdcc33924e21a6fef7c91ab5fc5e9182d9680bf8ebfa8` |
| `assets/oru-spell-1.png` | `exec-b979545c-d7d1-41e1-a4dd-e5db87785c20.png` | 1: [418, 0, 836, 418] | `51a3371a68248a1b8f82c754b085510f382509c6171abef3c00f671ecee77d18` |
| `assets/oru-spell-2.png` | `exec-b979545c-d7d1-41e1-a4dd-e5db87785c20.png` | 2: [836, 0, 1254, 418] | `df67c99bbf567a7d7c0a23bcb179e1d33772409e7aabe5411fc9fc8d2b0c9964` |
| `assets/oru-spell-3.png` | `exec-b979545c-d7d1-41e1-a4dd-e5db87785c20.png` | 3: [0, 418, 418, 836] | `be63c5aa1ce6cf7cfcd08f9e0b958467b8ed7ae5f770d8dd85b8f88105f514e4` |
| `assets/oru-spell-4.png` | `exec-b979545c-d7d1-41e1-a4dd-e5db87785c20.png` | 4: [418, 418, 836, 836] | `5c763059fa7c85d2abd38c6e2ef6ba67e9bbeb6891ae377470428e9dfedae7f2` |
| `assets/oru-spell-5.png` | `exec-b979545c-d7d1-41e1-a4dd-e5db87785c20.png` | 5: [836, 418, 1254, 836] | `680c58acd33e42b779c9d565f4e5da207c850babdf1f9eb90ed4b6beaff1cb88` |
| `assets/oru-spell-6.png` | `exec-b979545c-d7d1-41e1-a4dd-e5db87785c20.png` | 6: [0, 836, 418, 1254] | `a2287884ef8c243823400d51dd908818c53149d062a64c925f259cec2c286c7a` |
| `assets/oru-spell-7.png` | `exec-b979545c-d7d1-41e1-a4dd-e5db87785c20.png` | 7: [418, 836, 836, 1254] | `7bf5241088d648bfd154cbeacb161a861804506fdad528fa7e9ae1b179d11ea3` |
| `assets/oru-spell-8.png` | `exec-b979545c-d7d1-41e1-a4dd-e5db87785c20.png` | 8: [836, 836, 1254, 1254] | `d02d0b7645e8fcd981477221700e50910189622f3adb37b3dceebae04fe416aa` |
| `assets/veska.png` | `exec-8ea9e172-0091-40de-9fe9-e856a0ce70f6.png` | 0: [0, 0, 418, 418] | `134aa2d6cf50157d1c0e202cf7ccff3e21d452ed9b779cfbf8f8c5d7aea19b6b` |
| `assets/veska-spell-1.png` | `exec-8ea9e172-0091-40de-9fe9-e856a0ce70f6.png` | 1: [418, 0, 836, 418] | `f37d7e714ec4dd5e0bf6919a4c9b3e5f8f44689bc45ab1e95ef5ef0a8f269c9f` |
| `assets/veska-spell-2.png` | `exec-8ea9e172-0091-40de-9fe9-e856a0ce70f6.png` | 2: [836, 0, 1254, 418] | `8bc60263d7db13ac922402beeef3e01bd36015fda6c985667a59fb8bceb756f7` |
| `assets/veska-spell-3.png` | `exec-8ea9e172-0091-40de-9fe9-e856a0ce70f6.png` | 3: [0, 418, 418, 836] | `b8b25b37f9cfca9f4b387ff32ac6bd356f8a70d6105b5ef027ab0f341b5770cc` |
| `assets/veska-spell-4.png` | `exec-8ea9e172-0091-40de-9fe9-e856a0ce70f6.png` | 4: [418, 418, 836, 836] | `26df8c4060ae0597097e4a92c30dd10f2e3586c8c35c5fa2bc3e091434309222` |
| `assets/veska-spell-5.png` | `exec-8ea9e172-0091-40de-9fe9-e856a0ce70f6.png` | 5: [836, 418, 1254, 836] | `874c61fe1cf0e7a85ddab1b21df11589d59bd9a61dff84c2431429361b0952bc` |
| `assets/veska-spell-6.png` | `exec-8ea9e172-0091-40de-9fe9-e856a0ce70f6.png` | 6: [0, 836, 418, 1254] | `7740d5c28e4db40fb8382b8e868cf32e487aa594ece593a482331cda70b658dc` |
| `assets/veska-spell-7.png` | `exec-8ea9e172-0091-40de-9fe9-e856a0ce70f6.png` | 7: [418, 836, 836, 1254] | `9a99d51134cd820d26833d29af4ef68822ed526d3531ae827f024010645dd310` |
| `assets/veska-spell-8.png` | `exec-8ea9e172-0091-40de-9fe9-e856a0ce70f6.png` | 8: [836, 836, 1254, 1254] | `142221e0ea078bc2e7edfc9d8bbd22fcae1b808a87012de0e82f7b6bcb06d3c1` |
| `assets/pella.png` | `exec-9e101895-3bb8-4ac1-9709-d626ca5c8b8a.png` | 0: [0, 0, 418, 418] | `61eb52581013bb7ff47ac30427da3fa54794cdc33973970e0c6cf3815675adbc` |
| `assets/pella-spell-1.png` | `exec-9e101895-3bb8-4ac1-9709-d626ca5c8b8a.png` | 1: [418, 0, 836, 418] | `2dddfabd40e91401c5897858e47289f1abe1574ec801992f629ef9f687238f55` |
| `assets/pella-spell-2.png` | `exec-9e101895-3bb8-4ac1-9709-d626ca5c8b8a.png` | 2: [836, 0, 1254, 418] | `18439548f502e0a9688228295e40122a75701e605afbfe3bbba6a676de72170f` |
| `assets/pella-spell-3.png` | `exec-9e101895-3bb8-4ac1-9709-d626ca5c8b8a.png` | 3: [0, 418, 418, 836] | `0a57cc0831eb1676a95b1658b695320d0f01431e52addf726b868fed4630a099` |
| `assets/pella-spell-4.png` | `exec-9e101895-3bb8-4ac1-9709-d626ca5c8b8a.png` | 4: [418, 418, 836, 836] | `cfbc26725753199df31f029e86656018aa992929e84d147d98bbcda5fdf3ff0d` |
| `assets/pella-spell-5.png` | `exec-9e101895-3bb8-4ac1-9709-d626ca5c8b8a.png` | 5: [836, 418, 1254, 836] | `9cd199073196788570704f41f4658c7e6103a441eb134f9234f241102d19d2de` |
| `assets/pella-spell-6.png` | `exec-9e101895-3bb8-4ac1-9709-d626ca5c8b8a.png` | 6: [0, 836, 418, 1254] | `2959289557a3e58d8a2206c8b5745ff2d38fe3a6a9a15c2696e5438bd5395532` |
| `assets/pella-spell-7.png` | `exec-9e101895-3bb8-4ac1-9709-d626ca5c8b8a.png` | 7: [418, 836, 836, 1254] | `ad29bf9d1dfe13078ce6faff03c10d19f8de096c6847a6bf26f3164fde76a09f` |
| `assets/pella-spell-8.png` | `exec-9e101895-3bb8-4ac1-9709-d626ca5c8b8a.png` | 8: [836, 836, 1254, 1254] | `1dcf9fae36add42ce973b39ec9e65cb8e31a3a581ffef0bb4a0f9bf4e0e8e2a5` |
| `assets/iman.png` | `exec-095f2d39-e25f-42f8-8d0d-1ee3f31b8c94.png` | 0: [0, 0, 418, 418] | `e2e239ed094719cd67d6783ca30de581f3310a1e57988bc04c6558b7e9abf231` |
| `assets/iman-spell-1.png` | `exec-095f2d39-e25f-42f8-8d0d-1ee3f31b8c94.png` | 1: [418, 0, 836, 418] | `f61829ebbaeb88bac74786ffcc6dcdc304efc49a130d446e270db55a4647d2c9` |
| `assets/iman-spell-2.png` | `exec-095f2d39-e25f-42f8-8d0d-1ee3f31b8c94.png` | 2: [836, 0, 1254, 418] | `dc5a0aaa633f3c398a8f1716df16b7f46a21b643d94845599cb2a288d53ea649` |
| `assets/iman-spell-3.png` | `exec-095f2d39-e25f-42f8-8d0d-1ee3f31b8c94.png` | 3: [0, 418, 418, 836] | `62b92c0f9918777b36532985a10dbdc4c36b5c352e3e1d6f8525040edcdc6986` |
| `assets/iman-spell-4.png` | `exec-095f2d39-e25f-42f8-8d0d-1ee3f31b8c94.png` | 4: [418, 418, 836, 836] | `a5243281436266d3ba365f466486ed4c7f70fdc24b1355baffd7de5d4fa89d22` |
| `assets/iman-spell-5.png` | `exec-095f2d39-e25f-42f8-8d0d-1ee3f31b8c94.png` | 5: [836, 418, 1254, 836] | `a4dc9271eb787c466d233b574042c65d6af8e396289cdfa29e4c8dd368aaa876` |
| `assets/iman-spell-6.png` | `exec-095f2d39-e25f-42f8-8d0d-1ee3f31b8c94.png` | 6: [0, 836, 418, 1254] | `f66ae63371963bf74faac7ca0944a4f2adde263b804d5875063bf0166be7f062` |
| `assets/iman-spell-7.png` | `exec-095f2d39-e25f-42f8-8d0d-1ee3f31b8c94.png` | 7: [418, 836, 836, 1254] | `4248d66603e14a5e367a69860211c0eb411a1d56c1b8b88e0775a4baa9749e9d` |
| `assets/iman-spell-8.png` | `exec-095f2d39-e25f-42f8-8d0d-1ee3f31b8c94.png` | 8: [836, 836, 1254, 1254] | `1ffff64f28eb59c9698b0e506a624b0f793f21d74f403b96a892c2cceeea1258` |
| `assets/sile.png` | `exec-c75c7440-2b5a-4859-910c-6349a7658e92.png` | 0: [0, 0, 418, 418] | `6736d446127441bb2b8b8d5543dcd23a279e4086cd517f281da05503c1ba3e69` |
| `assets/sile-spell-1.png` | `exec-c75c7440-2b5a-4859-910c-6349a7658e92.png` | 1: [418, 0, 836, 418] | `66c6ae3ea1c1a76bbdf3957494b247e0dc9d4a3ba8204f1fb71bd0b991520d6b` |
| `assets/sile-spell-2.png` | `exec-c75c7440-2b5a-4859-910c-6349a7658e92.png` | 2: [836, 0, 1254, 418] | `da329a493d10422a3421b255214635f95da1bf633392bc918b109773e959957f` |
| `assets/sile-spell-3.png` | `exec-c75c7440-2b5a-4859-910c-6349a7658e92.png` | 3: [0, 418, 418, 836] | `17914a22d3aa01b7dc5cf2efcf6044bd68caa7dcb5e1565a28161f410ffdbd0c` |
| `assets/sile-spell-4.png` | `exec-c75c7440-2b5a-4859-910c-6349a7658e92.png` | 4: [418, 418, 836, 836] | `a0a1ddec70f947358bbfc25cb8a1356277a74f4435a58e4c89aa4f7a1c5382e9` |
| `assets/sile-spell-5.png` | `exec-c75c7440-2b5a-4859-910c-6349a7658e92.png` | 5: [836, 418, 1254, 836] | `cc7c47eb1212494c31d2f60c6a028518c65819895db8ec1df6b9f9908d29bde7` |
| `assets/sile-spell-6.png` | `exec-c75c7440-2b5a-4859-910c-6349a7658e92.png` | 6: [0, 836, 418, 1254] | `6c7b03682066be1fd75a162eee2a24aaaebedf80575b70cc049213dd728f869f` |
| `assets/sile-spell-7.png` | `exec-c75c7440-2b5a-4859-910c-6349a7658e92.png` | 7: [418, 836, 836, 1254] | `8b118f6ef6e0aea2c6fc0ea6305374f7a8ccb5f65254c026befa5c8afa6fc69f` |
| `assets/sile-spell-8.png` | `exec-c75c7440-2b5a-4859-910c-6349a7658e92.png` | 8: [836, 836, 1254, 1254] | `b2b782455cabaa2acab021562beb26e226b1504e1a93273ea5e0361815bca7b7` |
| `assets/nemi.png` | `exec-bfb8978d-1403-4ddb-a5cc-12b7414f27b7.png` | 0: [0, 0, 418, 418] | `87ec0ed56b63b9b4fab65fedb5b4a82c6c23071591301db70994cf8c89a218ee` |
| `assets/nemi-spell-1.png` | `exec-bfb8978d-1403-4ddb-a5cc-12b7414f27b7.png` | 1: [418, 0, 836, 418] | `4d676e98802ad9491b82f7b36f6f6f1c528f3fa677462e7e063b9a7c918b37ed` |
| `assets/nemi-spell-2.png` | `exec-bfb8978d-1403-4ddb-a5cc-12b7414f27b7.png` | 2: [836, 0, 1254, 418] | `784862b79ad8461c8fd694088e80b800692ad80117210a88bb91555edc845c6b` |
| `assets/nemi-spell-3.png` | `exec-bfb8978d-1403-4ddb-a5cc-12b7414f27b7.png` | 3: [0, 418, 418, 836] | `5eec704ebe9bc560ab3165edb286bac9f1397f7c8e79344a02a345a9ccb12a70` |
| `assets/nemi-spell-4.png` | `exec-bfb8978d-1403-4ddb-a5cc-12b7414f27b7.png` | 4: [418, 418, 836, 836] | `624b0cc57e0df897d16008dbdbc80a518dd0338d44c556f6e00ddd10cd524c16` |
| `assets/nemi-spell-5.png` | `exec-bfb8978d-1403-4ddb-a5cc-12b7414f27b7.png` | 5: [836, 418, 1254, 836] | `908c553565fe89b20fd66f7ca047959ffab7eca8bf8055b97105e73faea3eb55` |
| `assets/nemi-spell-6.png` | `exec-bfb8978d-1403-4ddb-a5cc-12b7414f27b7.png` | 6: [0, 836, 418, 1254] | `9fc8c521baa62228a2b4ed5284b57d086a1c1c7c646dc86733c6361a422aa12b` |
| `assets/nemi-spell-7.png` | `exec-bfb8978d-1403-4ddb-a5cc-12b7414f27b7.png` | 7: [418, 836, 836, 1254] | `5ee251486a60a6da86f6b5d315f54a61c9950caa073dde1a53f316e0f48a28fc` |
| `assets/nemi-spell-8.png` | `exec-bfb8978d-1403-4ddb-a5cc-12b7414f27b7.png` | 8: [836, 836, 1254, 1254] | `4b4d62bdec4f765fc5e6217f3a2ddb0e7d4c7294d8d6e61bf08da13430a716d0` |
| `assets/tollweaver.png` | `exec-c98e48e9-6711-46a8-82df-56eeb297c291.png` | 0: [0, 0, 418, 418] | `9857ce311001dc972b2328587d59d36e6923d596f92f71c9c194da5c7b5c2612` |
| `assets/hush.png` | `exec-c98e48e9-6711-46a8-82df-56eeb297c291.png` | 1: [418, 0, 836, 418] | `e86a921fd82b9eb18e4fc3e9d48dd4166c5ba3e920d67da0cef28127b52c7864` |
| `assets/caldrum.png` | `exec-c98e48e9-6711-46a8-82df-56eeb297c291.png` | 2: [836, 0, 1254, 418] | `12ac82f6c1ca6930d855546b2c59959894164fb45a4f2977088a051347e11387` |
| `assets/velis.png` | `exec-c98e48e9-6711-46a8-82df-56eeb297c291.png` | 3: [0, 418, 418, 836] | `7bb337c6cfa4948300efb155d1e5a681773cbd73982200556524f982a6a2994c` |
| `assets/morrow.png` | `exec-c98e48e9-6711-46a8-82df-56eeb297c291.png` | 4: [418, 418, 836, 836] | `18c7bc8f5cea5c14db8f19f9539168e9f935d66a2b1705e9cc78b0a55916641a` |
| `assets/aurex.png` | `exec-c98e48e9-6711-46a8-82df-56eeb297c291.png` | 5: [836, 418, 1254, 836] | `0f20b38f4dc083adefee9cf60966c49ed36d4d4349d8026f7f49071640d9e155` |
| `assets/covenant.png` | `exec-c98e48e9-6711-46a8-82df-56eeb297c291.png` | 6: [0, 836, 418, 1254] | `c18a1052b5ae9a4425d934e0bd1c64bbe50f7b34553da36fdee659c13c8d2722` |
| `assets/tollweaver-realm.png` | `exec-a6838463-fbcc-46ac-9838-99ba47839ebf.png` | 0: [0, 0, 557, 314] | `8fc72206184ec9f7c75bf8e7c03b0df47d873904c674f4934d70658cda6f8eff` |
| `assets/hush-realm.png` | `exec-a6838463-fbcc-46ac-9838-99ba47839ebf.png` | 1: [557, 0, 1115, 314] | `0b2a063d269b08ddf347bb459e9eea7cdec8125c1b179aedf4ca2fb03b8868c4` |
| `assets/caldrum-realm.png` | `exec-a6838463-fbcc-46ac-9838-99ba47839ebf.png` | 2: [1115, 0, 1672, 314] | `90a413f0112787604075ce5e9bd90e07f6d222e57f944b3afef41ce17426d0f9` |
| `assets/velis-realm.png` | `exec-a6838463-fbcc-46ac-9838-99ba47839ebf.png` | 3: [0, 314, 557, 627] | `65ed016589c90a39528e466111ba514a7e1c4c1c183269208513b6c29aa6b676` |
| `assets/morrow-realm.png` | `exec-a6838463-fbcc-46ac-9838-99ba47839ebf.png` | 4: [557, 314, 1115, 627] | `6d1b58e8df9a7150aac66e2cebb572033847ef563f336dae9cf9036f1c7cc08d` |
| `assets/aurex-realm.png` | `exec-a6838463-fbcc-46ac-9838-99ba47839ebf.png` | 5: [1115, 314, 1672, 627] | `500855d2cbae059b6f970b2f0dd1531ee60d758bec5b10bb57cac78a73a0ab78` |
| `assets/covenant-realm.png` | `exec-a6838463-fbcc-46ac-9838-99ba47839ebf.png` | 6: [0, 627, 557, 941] | `721a6ede001e2f5c131a6567eb5f78919e6013bf46e26815f59b36a021821e29` |
| `assets/hub.png` | `exec-a6838463-fbcc-46ac-9838-99ba47839ebf.png` | 7: [557, 627, 1115, 941] | `1319f08f69342af24f2e397fc96d67dbdfc86fdde6a6e33cb337d77125133059` |
| `assets/cover.png` | `exec-737f95a4-b31b-4d25-9f8e-8adc789af2c8.png` | standalone: direct copy | `d76e02ddcf03e3c338dea0d614c3bec66277691e3d99b49d2aaf8d2f5fbbd9f8` |
