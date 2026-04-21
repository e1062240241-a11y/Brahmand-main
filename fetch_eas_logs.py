import ssl
import urllib.request

urls = [
    "https://job-logs.eascdn.net/production/dc5a4929-cbfd-4a59-8648-e51d728a4f17/1776318016169-abded973-a1e2-4173-ad3f-080f4251d299.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260416%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260416T055535Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=79eb793184b1bf4e2ce0bc8ee00ba08f935c2a3c7b8c0d08fc60fa141557442786519c7b6ddb26a027b2875efd7780fff8277fda5ac8d9ab4a77b0761ff2c0171999fe923bc386fcc84ffb1f652da807103e7de3fce6700de267db7676913c9acaa26a7b2ae07a76a6c7761370202df3dc17eb9f49eb4d37381d2a799bc2117e3f958a21d8cf01269f121ec5ae29c8a8bf03a5eb16ccb87750b5d9af1f74ac5386e5048e41be40f0e48bd9d82e0b56d2afa64df2e768787f18a7b2f3e745608bcbf27d6c72ce92a6f08dbdae176fec63bbaf712ec96b4113a5305bae73ae55ffe137c3123feaef3331f6b504f73b9032621ba815b173dbea555cff5d3f694ac9",
    "https://job-logs.eascdn.net/production/dc5a4929-cbfd-4a59-8648-e51d728a4f17/1776318024250-747189a4-1f87-494d-a42f-8b1e7584e654.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260416%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260416T055535Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=244a2f6c94518bfdfb1ac328487bf6f0a245ad3d7eb46547250a12c0d9cdbbb898053c1222311ed4ef9c35931410ec3b487bc5d73c40234f7991f18bcec7804df07eb0d3aed07dfee7391da6f3363692fc41d952d9319241e9cef48bd7a29cadaf51eab495056d169faf4b4ae0bf6b629c058fa7ab3f52529f3c21e827fa8d58c505147cd429d5657ff7002ef3de27538463a3bb966342a71ce6df1c15746f1ff709173fb872d677a4e8f5ae97f80578234e2c06dda2640ecf846d59cdeb73a58386086f2badbf36aaed75d6240177ed19299bf1fc16339d25ebf48775bd430177f33375ba6be7340984a6c2999534a910f790875726d593a67237fc9e694188",
    "https://job-logs.eascdn.net/production/dc5a4929-cbfd-4a59-8648-e51d728a4f17/1776318024493-dadc5f9b-847e-454c-a08c-1ed04988dcb6.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260416%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260416T055535Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=2ef48a32fa4d2dc2bb02070c322f7e341bbfec388c95773658df1bbd01993b2aa1a1c98b3c7cce5c8d98e30d91df208afe2b0f654264ef73c3079731da3506d3e4067951451362447e84ba95c45680d3c64d62c61697ab9656830d2ce6346e533434e3172c0ed49cc412e76107fc5dd9cfb1b9179e0169496b409a7fbd5aad6c1a0a3e42cf66c0a9a98aef5887e49b51f8fbdc1670a6a607a6669c5e56f49ad697d85c5e8c40a8a584ac250ff712b1b9c4b381b1ed67513371df352206d9cadbe5b5f0ec546f69ce2caf7a10aabbd721a86c9b56315bcef46debe8ac69ade3582367de27c4b8e61106f4c6e497eee6dd02c10fb09fa2cdbd22230079f3c765f3",
    "https://job-logs.eascdn.net/production/dc5a4929-cbfd-4a59-8648-e51d728a4f17/1776318024688-7c6afc7e-a286-420f-940f-f809a570e3df.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260416%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260416T055535Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=8c4e9112578ca5c8a63835efdd94527746d8706c6f106c1f02ad91bdf17f003c208203635f44de7f7bc1c87a58d458bb6a50cc9c9e68ea578854832b7d4fe781a72f5021d9247afaed251ea69e742a2543c4ea4a579660e64ff73e57c4c6fb9bdbcd90782e3671f4eceba00824a51d7df05460874500e4baa5ee6c6ac01c193ed1ee6e9d286d9c0cef5dc79b2a6250718e7696f78fd6cb30fd22a6e331eb634326704c9820cbe3c99aaf2cb0af10c073d7fece1c89c58449bbf9de9ae867f6760796919715b54ba4b480703b1673f89916961f45b691bc22185ee34b294851bebab5db202b7e8b9fa69c09edcc71637f1add435e6097b5e50d0183c44cae56a5"
]

for i, url in enumerate(urls, 1):
    print('=== FILE', i, '===')
    try:
        data = urllib.request.urlopen(url, timeout=30, context=ssl._create_unverified_context()).read().decode('utf-8', 'ignore')
    except Exception as e:
        print('FETCH ERROR', e)
        continue
    lines = data.splitlines()
    print('lines', len(lines))
    for j, line in enumerate(lines[-80:], start=max(1, len(lines)-79)):
        if any(k in line for k in ['Read app config', 'ERROR', 'Exception', 'FAIL', 'Could not', 'error', 'Invalid']):
            print(j, line)
