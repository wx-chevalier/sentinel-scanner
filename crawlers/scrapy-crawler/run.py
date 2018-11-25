# coding:utf-8
import argparse
from scrapy.cmdline import execute


def create_cmd_parser():
    parser = argparse.ArgumentParser(
        formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument(
        '--target', required=True, type=str, dest='target',
        help='识别目标主机 URL/IP/域名')
    parser.add_argument(
        '--timeout', required=False, type=int, dest='timeout',default=1800,
        help='爬虫超时时间（单位：秒）默认1800')
    parser.add_argument(
        '--depth-limit', required=False, type=int, dest='depth_limit',default=5,
        help='爬虫深度,默认5')
    parser.add_argument(
        '--json-out-file', required=False, type=str, dest='json_out_file',default="./urls.json",
        help='以 JSON 格式输出结果到文件')
    return parser

def main(target=None, timeout=1800, depth_limit=5, json_out_file="./urls.json"):
    if target==None:
        parser = create_cmd_parser()
        args = parser.parse_args()
        target = args.target
        timeout = args.timeout
        depth_limit = args.depth_limit
        json_out_file = args.json_out_file
    # print(target, timeout, depth_limit, json_out_file)
    shell = "scrapy crawl getallurls -a target={0} -a timeout={1} -s DEPTH_LIMIT={2} -o {3}".format(target, timeout, depth_limit, json_out_file)
    execute(shell.split())


if __name__ == "__main__":
    main()