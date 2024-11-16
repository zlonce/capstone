from  person_detector import PersonDetector
from nsfw_detector import NSFWDetector
from text_detector import TextDetector
from get_tag import tagging
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def validate(image_path):
    nsfw_detector = NSFWDetector(threshold=0.5)
    person_detector = PersonDetector('./person_detection.pth')
    text_detector = TextDetector()

    if nsfw_detector.detect(image_path) :
        return "nsfw"
    elif text_detector.detect(image_path) :
        return "text"
    elif person_detector.detect(image_path):
        return "person"
    else : return False

def get_tag(image_path) :
    tag = tagging(image_path)
    print(tag)
    return tag

def tag_process(image_path) :
    error = validate(image_path)
    if error :
        print(f'{error}가 포함된 이미지 입니다.')
    else :
        tag = get_tag(image_path)
        print(tag)

def main() :
    image_path = './test/nsfwtest.jpeg'
    tag_process(image_path)

if __name__ == '__main__':
    main()