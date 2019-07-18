provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-nc-demo"
    key    = "##PLACEHOLDER##"
    region = "us-east-1"
  }
}

variable branch {}

variable zoneId {
  default = "ZTH40J9BJ47PS"
}

variable root_domain {
  default = "nc-demo.com"
}

variable sslArn {
  default = "arn:aws:acm:us-east-1:670848316581:certificate/ff16dd89-bb54-47d7-b8e6-1e9cc607d8c5"
}

resource "aws_route53_record" "site" {
  zone_id = "${var.zoneId}"
  name    = "${var.branch}.${var.root_domain}"
  type    = "A"
  alias {
    name                   = "${aws_cloudfront_distribution.site.domain_name}"
    zone_id                = "${aws_cloudfront_distribution.site.hosted_zone_id}"
    evaluate_target_health = false
  }
}

resource "aws_s3_bucket" "site" {
  bucket = "${var.branch}.${var.root_domain}"
  acl    = "private"
  region = "us-east-1"
  force_destroy = true
  tags = {
    environment = "production"
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = "${aws_s3_bucket.site.id}"
  policy = <<EOF
{
  "Version": "2008-10-17",
  "Id": "SiteDomainS3Bucket",
  "Statement": [
    {
      "Sid": "CloudFront Access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_cloudfront_origin_access_identity.site.iam_arn}"
      },
      "Action": "s3:GetObject",
      "Resource": "${aws_s3_bucket.site.arn}/*"
    }
  ]
}
EOF
}

resource "aws_cloudfront_origin_access_identity" "site" {
  comment = "Site"
}

resource "aws_cloudfront_distribution" "site" {
  origin {
    domain_name = "${aws_s3_bucket.site.bucket_regional_domain_name}"
    origin_id   = "${var.branch}.${var.root_domain}"
    s3_origin_config {
      origin_access_identity = "${aws_cloudfront_origin_access_identity.site.cloudfront_access_identity_path}"
    }
     origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
  }
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Site"
  default_root_object = "index.html"
  wait_for_deployment = false
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    compress            = true
    target_origin_id = "${var.branch}.${var.root_domain}"
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  price_class = "PriceClass_100"
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  aliases = ["${var.branch}.${var.root_domain}"]
  tags = {
    environment = "production"
  }
  viewer_certificate {
    acm_certificate_arn = "${var.sslArn}"
    ssl_support_method = "sni-only"
    minimum_protocol_version = "TLSv1.1"
  }
}