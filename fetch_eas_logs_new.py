import ssl
import urllib.request

urls = [
    "https://job-logs.eascdn.net/production/dc5a4929-cbfd-4a59-8648-e51d728a4f17/1776318016169-abded973-a1e2-4173-ad3f-080f4251d299.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260416%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260416T060752Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=85a9b233692fea8bae61d0c75783fa0b3ca40d895d45846468404087b0bb67c79cd338d68849d9e09fa78e1de5b8caa86cd3dafbbf4214fc0fc54330a5106f4931db78fee4643040be9f74a966f5755d58a007980648e966dabe6dae3c1268e6c1ebb8a42510ad247969fd83e1a8fc14180228619d5f589643050d23c5fc59ec0f26f0aa8d058c197e4b8f98c05c72904e8234581da543f360847e1b08cd4d7889eed9ca22db912ea23f16fc0896af1716d7e5cee390415b14a394df16468963f192c5befb776f7b8825611839b3b156d7dceaacc5dc47b944d9ea2bd1a80b1f9026a0598100eedf0b396c2e28c04284f1d147f7153a356c833aa3a7d2bc54ad",
    "https://job-logs.eascdn.net/production/dc5a4929-cbfd-4a59-8648-e51d728a4f17/1776318024250-747189a4-1f87-494d-a42f-8b1e7584e654.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260416%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260416T060752Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=23634aa980e9f68d8f40d6c31a6afe675cc1d9588720cc30b5066f9058ba93cc5c24513028298042c91eaa614f2974cb60fd58bd47284f0e67a46dfb3696af6cbaae9929704429deb2c186ee00b3fd9c0e091997e2156748b89c7f54eb57ea8271c5e22a1f3704defacf32e5b79febbc9455dbbbd763df3844197ed3e6528b14077dd64152cae950ef078ca85375a4264bed0c588daf67389989e6c9d30f2a10e7b55fec50849ede39043523cc85bc7ca3a9c0eccba7a4ab868650dbdec0fc434e0aea4e0f4c419c7daa6b8b94a89fffb6d34a570eb6a860a04ba2e7312438a645ad11b4a394dd9668846c6dc00a8ade024b222f3df3262f5faebf2cab3ed713",
    "https://job-logs.eascdn.net/production/dc5a4929-cbfd-4a59-8648-e51d728a4f17/1776318024493-dadc5f9b-847e-454c-a08c-1ed04988dcb6.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260416%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260416T060752Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=2ce41e09c900d8ddc52c0ccd8565fd74aecffbc5312911f573eedd18597c8cc35b989d45e038b049aa507ff55af423ff24688dfd69f32af264ce3f947e70e3b5bf5e49ca8961c0a04d59c8f2a26631dcc6dbb4af843883651e76eb717c4961bba81c369a113e1932e1b963432e469f8bd4af55b6702e49221d8db264eaf32ec295ad9b9873174dc65518780e26607f4b64b467d7bbb3ab5dcb19c803f53f3465fd47bb2d55fb07114ae22723f1ef5b1f5d5655479c035ebd0e30c3e5960cfed1ae80f64079f36903cbc25b349df34f2b16b1b7d621f95fcfec2f7062305873502282989192066413d9c16c8ee75d2aeea4be87c391344ad16109915d694a41a4",
    "https://job-logs.eascdn.net/production/dc5a4929-cbfd-4a59-8648-e51d728a4f17/1776318024688-7c6afc7e-a286-420f-940f-f809a570e3df.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260416%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260416T060752Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=3736596429eab7581015c35524849247452ab70cfd16729b62dfbd3199cf2677f40a08fcf94cb7d6fbfd9940c901ce248a0e5da9ca7dab67f8db7c732e28b1b28de89fe806d7a635d13c05f65e422a5a6403782bf4266ab8aba9adda0e711aa5ef1c6f6999855c47f9147792056aca5ed7be15d6ac6f93958bfe60c9c5d90562f49983a8c6e62ab9994d466a83f936b6b8027dead3399bc611ce7e81b6ee1ec2ad5f24d2bb5a98d7758f415ad3ad795340c607028bdee43c71cbe4e9f5ef8eff2b26e4818cab1bb021300537e1b2f9561f53ca3eae768caf92bed297156bd910beea294d9eb49b942599f6bf75f93bca3b7dbca16ba73616e80a6ce74e2947b2"
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
    for j, line in enumerate(lines[-120:], start=max(1, len(lines)-119)):
        if any(k in line for k in ['Read app config', 'ERROR', 'Exception', 'FAIL', 'Could not', 'error', 'Invalid']):
            print(j, line)
